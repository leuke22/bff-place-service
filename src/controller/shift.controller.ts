import { Request, Response } from "express";
import { eq, and, isNull, gte, lte, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Shifts, Payments, Orders } from "../models";
import { openShiftSchema, closeShiftSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

// Every payment this cashier took between `from` and `to` is one "earning" event.
// Cash sales are net of change given back — that's what actually stays in the drawer.
async function computeShiftSummary(cashierId: number, from: Date, to: Date) {
    const rows = await db
        .select({
            method: Payments.method,
            tendered: Payments.amount_tendered,
            change: Payments.change,
            orderTotal: Orders.total,
        })
        .from(Payments)
        .innerJoin(Orders, eq(Payments.order_id, Orders.id))
        .where(and(
            eq(Orders.cashier_id, cashierId),
            gte(Payments.paid_at, from),
            lte(Payments.paid_at, to),
        ));

    let totalSales = 0;
    let cashCollected = 0;
    for (const row of rows) {
        totalSales += Number(row.orderTotal);
        if (row.method === "cash") {
            cashCollected += Number(row.tendered) - Number(row.change);
        }
    }

    return {
        order_count: rows.length,
        total_sales: totalSales.toFixed(2),
        cash_collected: cashCollected.toFixed(2),
    };
}

async function listShiftPayments(cashierId: number, from: Date, to: Date) {
    return db
        .select({
            id: Payments.id,
            method: Payments.method,
            amount_tendered: Payments.amount_tendered,
            change: Payments.change,
            paid_at: Payments.paid_at,
            order_id: Orders.id,
            order_uuid: Orders.uuid,
            order_number: Orders.order_number,
            order_total: Orders.total,
        })
        .from(Payments)
        .innerJoin(Orders, eq(Payments.order_id, Orders.id))
        .where(and(
            eq(Orders.cashier_id, cashierId),
            gte(Payments.paid_at, from),
            lte(Payments.paid_at, to),
        ))
        .orderBy(desc(Payments.paid_at));
}

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

    const summary = await computeShiftSummary(cashierId, shift.opened_at, new Date());
    return DataResponse(res, { ...shift, summary });
}

export async function getShift(req: Request, res: Response) {
    const id = Number(req.params.id);
    const requester = req.user!;

    const shift = await db.query.Shifts.findFirst({
        where: eq(Shifts.id, id),
        with: { cashier: { columns: { id: true, first_name: true, last_name: true } } },
    });
    if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
    }
    // Admin/manager can look at anyone's shift; a cashier can only look at their own.
    if (requester.role === "cashier" && shift.cashier_id !== requester.user_id) {
        return res.status(403).json({ message: "You can only view your own shifts" });
    }

    const to = shift.closed_at ?? new Date();
    const summary = await computeShiftSummary(shift.cashier_id, shift.opened_at, to);
    const payments = await listShiftPayments(shift.cashier_id, shift.opened_at, to);

    return DataResponse(res, { ...shift, summary, payments });
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
    const { cash_collected } = await computeShiftSummary(cashierId, shift.opened_at, closedAt);
    const expectedCash = Number(shift.opening_cash) + Number(cash_collected);
    // closing_cash is what the cashier physically counted — this is the one number
    // the system never supplies on its own, by design.
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