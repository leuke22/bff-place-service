import { Request, Response } from "express";
import { eq, and, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Orders, OrderItems, Products, ProductVariants, Shifts } from "../models";
import { createOrderSchema, updateOrderStatusSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

const ORDER_STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<OrderStatus, string[]> = {
    pending: ["cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

const toCents = (value: number | string) => Math.round(Number(value) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

export async function createOrder(req: Request, res: Response) {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { order_type, discount, items } = parsed.data;
    const cashierId = req.user!.user_id;

    const openShift = await db.query.Shifts.findFirst({
        where: and(eq(Shifts.cashier_id, cashierId), isNull(Shifts.closed_at)),
    });
    if (!openShift) {
        return res.status(400).json({ message: "You must open a shift before taking orders" });
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const products = await db.query.Products.findMany({
        where: and(inArray(Products.id, productIds), isNull(Products.deleted_at)),
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const variantIds = [...new Set(items.flatMap((i) => (i.variant_id ? [i.variant_id] : [])))];
    const variants = variantIds.length
        ? await db.query.ProductVariants.findMany({
            where: and(inArray(ProductVariants.id, variantIds), isNull(ProductVariants.deleted_at)),
        })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotalCents = 0;
    const lines: {
        product_id: number;
        variant_id?: number;
        quantity: number;
        unit_price: string;
        subtotal: string;
        notes?: string;
    }[] = [];

    for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
            return res.status(400).json({ message: `Product ${item.product_id} does not exist` });
        }
        if (!product.is_active) {
            return res.status(400).json({ message: `"${product.name}" is currently unavailable` });
        }

        let unitCents = toCents(product.price);
        if (item.variant_id) {
            const variant = variantMap.get(item.variant_id);
            if (!variant || variant.product_id !== product.id) {
                return res.status(400).json({ message: `Invalid variant for "${product.name}"` });
            }
            if (variant.price_override !== null) {
                unitCents = toCents(variant.price_override);
            }
        }

        const lineCents = unitCents * item.quantity;
        subtotalCents += lineCents;
        lines.push({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: fromCents(unitCents),
            subtotal: fromCents(lineCents),
            notes: item.notes,
        });
    }

    const discountCents = toCents(discount);
    if (discountCents > subtotalCents) {
        return res.status(400).json({ message: "Discount cannot exceed the subtotal" });
    }
    const totalCents = subtotalCents - discountCents;

    const order = await db.transaction(async (tx) => {
        const [created] = await tx
            .insert(Orders)
            .values({
                order_number: "PENDING",
                order_type,
                subtotal: fromCents(subtotalCents),
                discount: fromCents(discountCents),
                total: fromCents(totalCents),
                cashier_id: cashierId,
            })
            .returning();

        const [numbered] = await tx
            .update(Orders)
            .set({ order_number: `ORD-${String(created.id).padStart(6, "0")}` })
            .where(eq(Orders.id, created.id))
            .returning();

        const insertedItems = await tx
            .insert(OrderItems)
            .values(lines.map((line) => ({ ...line, order_id: created.id })))
            .returning();

        return { ...numbered, items: insertedItems };
    });

    return DataResponse(res, order, 201);
}

export async function listOrders(req: Request, res: Response) {
    const status = ORDER_STATUSES.find((s) => s === req.query.status);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const where = status ? eq(Orders.status, status) : undefined;

    const [orders, [{ count }]] = await Promise.all([
        db.query.Orders.findMany({
            where,
            orderBy: (o, { desc }) => [desc(o.created_at)],
            limit,
            with: {
                items: { with: { product: { columns: { id: true, name: true } } } },
                payments: true,
            },
        }),
        db.select({ count: sql<number>`count(*)` }).from(Orders).where(where),
    ]);

    return ListResponse(res, orders, Number(count));
}

export async function getOrder(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const order = await db.query.Orders.findFirst({
        where: eq(Orders.uuid, uuid),
        with: {
            items: { with: { product: { columns: { id: true, name: true, image: true } } } },
            cashier: { columns: { id: true, first_name: true, last_name: true } },
            payments: true,
        },
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    return DataResponse(res, order);
}

export async function updateOrderStatus(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { status } = parsed.data;

    const order = await db.query.Orders.findFirst({ where: eq(Orders.uuid, uuid) });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
        return res.status(400).json({ message: `Cannot change an order from "${order.status}" to "${status}"` });
    }

    const [updated] = await db
        .update(Orders)
        .set({ status, updated_at: new Date() })
        .where(and(eq(Orders.uuid, uuid), eq(Orders.status, order.status)))
        .returning();

    if (!updated) {
        return res.status(409).json({ message: "Order was changed by someone else. Refresh and try again." });
    }
    return DataResponse(res, updated);
}