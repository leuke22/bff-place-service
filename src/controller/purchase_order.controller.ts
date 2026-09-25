import { Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { PurchaseOrders, PurchaseOrderItems, Ingredients, StockMovements, Suppliers } from "../models";
import { createPurchaseOrderSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

function generateOrderNumber() {
    // simple, collision-safe enough for now — swap for a running sequence if you need
    // human-friendly numbers like PO-000001
    return `PO-${Date.now()}`;
}

export async function createPurchaseOrder(req: Request, res: Response) {
    const parsed = createPurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { supplier_id, items } = parsed.data;

    const supplier = await db.query.Suppliers.findFirst({ where: eq(Suppliers.id, supplier_id) });
    if (!supplier) {
        return res.status(400).json({ message: "supplier_id does not reference an existing supplier" });
    }

    try {
        const result = await db.transaction(async (tx) => {
            let totalCost = 0;
            const itemRows = items.map((item) => {
                const subtotal = item.quantity * item.unit_cost;
                totalCost += subtotal;
                return {
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity.toFixed(3),
                    unit_cost: item.unit_cost.toFixed(2),
                    subtotal: subtotal.toFixed(2),
                };
            });

            const [purchaseOrder] = await tx
                .insert(PurchaseOrders)
                .values({
                    order_number: generateOrderNumber(),
                    supplier_id,
                    status: "pending",
                    total_cost: totalCost.toFixed(2),
                })
                .returning();

            const insertedItems = await tx
                .insert(PurchaseOrderItems)
                .values(itemRows.map((item) => ({ ...item, purchase_order_id: purchaseOrder.id })))
                .returning();

            return { ...purchaseOrder, items: insertedItems };
        });

        return DataResponse(res, result, 201);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: "One or more ingredient_id values do not reference an existing ingredient" });
    }
}

export async function listPurchaseOrders(req: Request, res: Response) {
    const [purchaseOrders, [{ count }]] = await Promise.all([
        db.query.PurchaseOrders.findMany({
            orderBy: (po, { desc }) => [desc(po.created_at)],
            with: { supplier: true, items: true },
        }),
        db.select({ count: sql<number>`count(*)` }).from(PurchaseOrders),
    ]);

    return ListResponse(res, purchaseOrders, Number(count));
}

export async function getPurchaseOrder(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const purchaseOrder = await db.query.PurchaseOrders.findFirst({
        where: eq(PurchaseOrders.uuid, uuid),
        with: {
            supplier: true,
            items: { with: { ingredient: true } },
        },
    });

    if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
    }
    return DataResponse(res, purchaseOrder);
}

export async function markAsOrdered(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const userId = req.user!.user_id;

    const purchaseOrder = await db.query.PurchaseOrders.findFirst({ where: eq(PurchaseOrders.uuid, uuid) });
    if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
    }
    if (purchaseOrder.status !== "pending") {
        return res.status(400).json({ message: `Cannot mark as ordered from status "${purchaseOrder.status}"` });
    }

    const [updated] = await db
        .update(PurchaseOrders)
        .set({ status: "ordered", ordered_by: userId, ordered_at: new Date(), updated_at: new Date() })
        .where(eq(PurchaseOrders.uuid, uuid))
        .returning();

    return DataResponse(res, updated);
}

export async function receivePurchaseOrder(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const purchaseOrder = await db.query.PurchaseOrders.findFirst({
        where: eq(PurchaseOrders.uuid, uuid),
        with: { items: true },
    });
    if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
    }
    if (purchaseOrder.status !== "ordered") {
        return res.status(400).json({ message: `Cannot receive from status "${purchaseOrder.status}". Mark as ordered first.` });
    }

    try {
        const result = await db.transaction(async (tx) => {
            for (const item of purchaseOrder.items) {
                const ingredient = await tx.query.Ingredients.findFirst({ where: eq(Ingredients.id, item.ingredient_id) });
                if (!ingredient) continue; // shouldn't happen given the FK, but guard anyway

                const newStock = Number(ingredient.current_stock) + Number(item.quantity);

                await tx.insert(StockMovements).values({
                    ingredient_id: item.ingredient_id,
                    type: "in",
                    quantity: item.quantity,
                    reason: `Received from purchase order ${purchaseOrder.order_number}`,
                    reference_type: "purchase_order",
                    reference_id: purchaseOrder.id,
                    created_by: req.user!.user_id,
                });

                await tx
                    .update(Ingredients)
                    .set({ current_stock: newStock.toFixed(3), updated_at: new Date() })
                    .where(eq(Ingredients.id, item.ingredient_id));
            }

            const [updated] = await tx
                .update(PurchaseOrders)
                .set({ status: "received", received_at: new Date(), updated_at: new Date() })
                .where(eq(PurchaseOrders.uuid, uuid))
                .returning();

            return updated;
        });

        return DataResponse(res, result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to receive purchase order" });
    }
}

export async function cancelPurchaseOrder(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const purchaseOrder = await db.query.PurchaseOrders.findFirst({ where: eq(PurchaseOrders.uuid, uuid) });
    if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
    }
    if (purchaseOrder.status === "received" || purchaseOrder.status === "cancelled") {
        return res.status(400).json({ message: `Cannot cancel from status "${purchaseOrder.status}"` });
    }

    const [updated] = await db
        .update(PurchaseOrders)
        .set({ status: "cancelled", updated_at: new Date() })
        .where(eq(PurchaseOrders.uuid, uuid))
        .returning();

    return DataResponse(res, updated);
}