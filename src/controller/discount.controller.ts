import { Request, Response } from "express";
import { eq, isNull, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Discounts } from "../models";
import { createDiscountSchema, updateDiscountSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

const MAX_PERCENT = 100;

export async function createDiscount(req: Request, res: Response) {
    const parsed = createDiscountSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [discount] = await db
        .insert(Discounts)
        .values({ ...parsed.data, value: parsed.data.value.toFixed(2) })
        .returning();
    return DataResponse(res, discount, 201);
}

export async function listDiscounts(req: Request, res: Response) {
    const activeOnly = req.query.active === "true";
    const baseWhere = activeOnly
        ? and(isNull(Discounts.deleted_at), eq(Discounts.is_active, true))
        : isNull(Discounts.deleted_at);

    const [discounts, [{ count }]] = await Promise.all([
        db.query.Discounts.findMany({
            where: baseWhere,
            orderBy: (d, { asc }) => [asc(d.name)],
        }),
        db.select({ count: sql<number>`count(*)` }).from(Discounts).where(baseWhere),
    ]);

    return ListResponse(res, discounts, Number(count));
}

export async function getDiscount(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const discount = await db.query.Discounts.findFirst({
        where: and(eq(Discounts.uuid, uuid), isNull(Discounts.deleted_at)),
    });

    if (!discount) {
        return res.status(404).json({ message: "Discount not found" });
    }
    return DataResponse(res, discount);
}

export async function updateDiscount(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateDiscountSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const existing = await db.query.Discounts.findFirst({
        where: and(eq(Discounts.uuid, uuid), isNull(Discounts.deleted_at)),
    });
    if (!existing) {
        return res.status(404).json({ message: "Discount not found" });
    }

    // A partial update can change type or value on its own, so check the merged result.
    const type = parsed.data.type ?? existing.type;
    const value = parsed.data.value ?? Number(existing.value);
    if (type === "percent" && value > MAX_PERCENT) {
        return res.status(400).json({ message: "A percent discount cannot be more than 100" });
    }

    const { value: _value, ...rest } = parsed.data;
    const [updated] = await db
        .update(Discounts)
        .set({
            ...rest,
            ...(parsed.data.value !== undefined ? { value: parsed.data.value.toFixed(2) } : {}),
            updated_at: new Date(),
        })
        .where(eq(Discounts.uuid, uuid))
        .returning();

    return DataResponse(res, updated);
}

export async function deleteDiscount(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const [deleted] = await db
        .update(Discounts)
        .set({ deleted_at: new Date() })
        .where(and(eq(Discounts.uuid, uuid), isNull(Discounts.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Discount not found" });
    }
    return res.status(204).send();
}
