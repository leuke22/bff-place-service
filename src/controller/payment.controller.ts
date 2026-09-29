import { Request, Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Orders, Payments, ProductIngredients, Ingredients, StockMovements } from "../models";
import { createPaymentSchema } from "../utils/validators";
import { DataResponse } from "../utils/responseHelper";

const ACTIVE_STATUSES = ["pending", "preparing", "ready"] as const;

export async function payOrder(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { method, amount_tendered } = parsed.data;
    const userId = req.user!.user_id;

    // Only cash is wired up for now. The other enum values already exist on the schema so
    // the API contract and UI won't need to change again once a payment gateway is added —
    // this check is the only thing to remove at that point.
    if (method !== "cash") {
        return res.status(400).json({
            message: "Online payment methods are not available yet. A payment gateway integration is coming soon — please use cash for now.",
        });
    }

    const order = await db.query.Orders.findFirst({
        where: eq(Orders.uuid, uuid),
        with: { items: true },
    });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (!(ACTIVE_STATUSES as readonly string[]).includes(order.status)) {
        return res.status(400).json({ message: `Cannot take payment for an order that is "${order.status}"` });
    }

    const total = Number(order.total);
    if (amount_tendered < total) {
        return res.status(400).json({ message: "Amount tendered is less than the order total" });
    }
    const change = amount_tendered - total;

    try {
        const result = await db.transaction(async (tx) => {
            const [payment] = await tx
                .insert(Payments)
                .values({
                    order_id: order.id,
                    method,
                    amount_tendered: amount_tendered.toFixed(2),
                    change: change.toFixed(2),
                })
                .returning();

            // Deduct ingredient stock from every order item's recipe
            const productIds = [...new Set(order.items.map((i) => i.product_id))];
            const recipeRows = productIds.length
                ? await tx.query.ProductIngredients.findMany({
                    where: inArray(ProductIngredients.product_id, productIds),
                })
                : [];

            const requiredByIngredient = new Map<number, number>();
            for (const item of order.items) {
                for (const recipe of recipeRows.filter((r) => r.product_id === item.product_id)) {
                    const needed = Number(recipe.quantity_used) * item.quantity;
                    requiredByIngredient.set(
                        recipe.ingredient_id,
                        (requiredByIngredient.get(recipe.ingredient_id) ?? 0) + needed
                    );
                }
            }

            for (const [ingredientId, quantityNeeded] of requiredByIngredient) {
                const ingredient = await tx.query.Ingredients.findFirst({ where: eq(Ingredients.id, ingredientId) });
                if (!ingredient) continue; // recipe points at a deleted ingredient — skip rather than fail the sale

                // Allowed to go negative: the food has already been made and served by the time
                // payment happens, so this must reflect what was actually used, even if that reveals
                // a shortfall. Manual "out" movements (entered directly by staff) stay blocked from
                // going negative in stock_movement.controller.ts — this is the one deliberate exception.
                const newStock = Number(ingredient.current_stock) - quantityNeeded;

                await tx.insert(StockMovements).values({
                    ingredient_id: ingredientId,
                    type: "out",
                    quantity: quantityNeeded.toFixed(3),
                    reason: `Used in order ${order.order_number}`,
                    reference_type: "order",
                    reference_id: order.id,
                    created_by: userId,
                });

                await tx
                    .update(Ingredients)
                    .set({ current_stock: newStock.toFixed(3), updated_at: new Date() })
                    .where(eq(Ingredients.id, ingredientId));
            }

            const [updatedOrder] = await tx
                .update(Orders)
                .set({ status: "completed", updated_at: new Date() })
                .where(eq(Orders.id, order.id))
                .returning();

            return { payment, order: updatedOrder };
        });

        return DataResponse(res, result, 201);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to process payment" });
    }
}