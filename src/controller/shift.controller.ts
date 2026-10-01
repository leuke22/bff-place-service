import { Request, Response } from "express";
import { eq, and, isNull, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Shifts, Payments, Orders } from "../models";
import { openShiftSchema, closeShiftSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function openShift(req: Request, res: Response) {
    const parsed = openShiftSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const cashierId = req.user!.user_id;

    const existing = await db.query.Shifts.findFirst({
        where: and(eq(Shifts.cashier_id, cashierId), isNull(Shifts.closed_at)),
    });
    if (existing) {
        return res.status(409).json({ message: "You already have an open shift" });
    }

    const [shift] = await db
        .insert(Shifts)
        .values({ cashier_id: cashierId, opening_cash: parsed.data.opening_cash.toFixed(2) })
        .returning();

    return DataResponse(res, shift, 201);
}

export async function getCurrentShift(req: Request, res: Response) {
    const cashierId = req.user!.user_id;

    const shift = await db.query.Shifts.findFirst({
        where: and(eq(Shifts.cashier_id, cashierId), isNull(Shifts.closed_at)),
    });

    if (!shift) {
        return res.status(404).json({ message: "No open shift" });
    }
    return DataResponse(res, shift);
}

export async function closeShift(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = closeShiftSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const cashierId = req.user!.user_id;

    const shift = await db.query.Shifts.findFirst({ where: eq(Shifts.id, id) });
    if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
    }
    if (shift.cashier_id !== cashierId) {
        return res.status(403).json({ message: "You can only close your own shift" });
    }
    if (shift.closed_at) {
        return res.status(400).json({ message: "Shift is already closed" });
    }

    const closedAt = new Date();

    // Expected cash = opening float + net cash actually taken in (tendered minus change
    // given back) on orders this cashier rang up while the shift was open.
    const [cashTotals] = await db
        .select({ total: sql<string>`coalesce(sum(${Payments.amount_tendered} - ${Payments.change}), 0)` })
        .from(Payments)
        .innerJoin(Orders, eq(Payments.order_id, Orders.id))
        .where(and(
            eq(Orders.cashier_id, cashierId),
            eq(Payments.method, "cash"),
            gte(Payments.paid_at, shift.opened_at),
            lte(Payments.paid_at, closedAt),
        ));

    const cashCollected = Number(cashTotals?.total ?? 0);
    const expectedCash = Number(shift.opening_cash) + cashCollected;
    const variance = parsed.data.closing_cash - expectedCash;

    const [updated] = await db
        .update(Shifts)
        .set({
            closing_cash: parsed.data.closing_cash.toFixed(2),
            expected_cash: expectedCash.toFixed(2),
            variance: variance.toFixed(2),
            closed_at: closedAt,
        })
        .where(eq(Shifts.id, id))
        .returning();

    return DataResponse(res, updated);
}

export async function listShifts(req: Request, res: Response) {
    const [shifts, [{ count }]] = await Promise.all([
        db.query.Shifts.findMany({
            orderBy: (s, { desc }) => [desc(s.opened_at)],
            with: { cashier: { columns: { id: true, first_name: true, last_name: true } } },
        }),
        db.select({ count: sql<number>`count(*)` }).from(Shifts),
    ]);

    return ListResponse(res, shifts, Number(count));
}