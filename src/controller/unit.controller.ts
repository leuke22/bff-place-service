import { Request, Response } from "express";
import { eq, isNull, and, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Units } from "../models";
import { createUnitSchema, updateUnitSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function createUnit(req: Request, res: Response) {
    const parsed = createUnitSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const existing = await db.query.Units.findFirst({
        where: and(eq(Units.symbol, parsed.data.symbol), isNull(Units.deleted_at)),
    });
    if (existing) {
        return res.status(409).json({ message: `Unit "${parsed.data.symbol}" already exists` });
    }

    const [unit] = await db.insert(Units).values(parsed.data).returning();
    return DataResponse(res, unit, 201);
}

export async function listUnits(req: Request, res: Response) {
    const activeOnly = req.query.active === "true";
    const baseWhere = activeOnly
        ? and(isNull(Units.deleted_at), eq(Units.is_active, true))
        : isNull(Units.deleted_at);

    const [units, [{ count }]] = await Promise.all([
        db.query.Units.findMany({
            where: baseWhere,
            orderBy: (u, { asc }) => [asc(u.name)],
        }),
        db.select({ count: sql<number>`count(*)` }).from(Units).where(baseWhere),
    ]);

    return ListResponse(res, units, Number(count));
}

export async function getUnit(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const unit = await db.query.Units.findFirst({
        where: and(eq(Units.uuid, uuid), isNull(Units.deleted_at)),
    });

    if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
    }
    return DataResponse(res, unit);
}

export async function updateUnit(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateUnitSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const existing = await db.query.Units.findFirst({ where: and(eq(Units.uuid, uuid), isNull(Units.deleted_at)) });
    if (!existing) {
        return res.status(404).json({ message: "Unit not found" });
    }

    if (parsed.data.symbol) {
        const duplicate = await db.query.Units.findFirst({
            where: and(eq(Units.symbol, parsed.data.symbol), isNull(Units.deleted_at), ne(Units.id, existing.id)),
        });
        if (duplicate) {
            return res.status(409).json({ message: `Unit "${parsed.data.symbol}" already exists` });
        }
    }

    const [updated] = await db
        .update(Units)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(Units.uuid, uuid))
        .returning();

    return DataResponse(res, updated);
}

export async function deleteUnit(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const [deleted] = await db
        .update(Units)
        .set({ deleted_at: new Date() })
        .where(and(eq(Units.uuid, uuid), isNull(Units.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Unit not found" });
    }
    return res.status(204).send();
}