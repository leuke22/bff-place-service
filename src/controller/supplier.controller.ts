import { Request, Response } from "express";
import { eq, isNull, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Suppliers } from "../models";
import { createSupplierSchema, updateSupplierSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function createSupplier(req: Request, res: Response) {
    const parsed = createSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [supplier] = await db.insert(Suppliers).values(parsed.data).returning();
    return DataResponse(res, supplier, 201);
}

export async function listSuppliers(req: Request, res: Response) {
    const [suppliers, [{ count }]] = await Promise.all([
        db.query.Suppliers.findMany({
            where: isNull(Suppliers.deleted_at),
            orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
        }),
        db.select({ count: sql<number>`count(*)` }).from(Suppliers).where(isNull(Suppliers.deleted_at)),
    ]);

    return ListResponse(res, suppliers, Number(count));
}

export async function getSupplier(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const supplier = await db.query.Suppliers.findFirst({
        where: and(eq(Suppliers.uuid, uuid), isNull(Suppliers.deleted_at)),
    });

    if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
    }
    return DataResponse(res, supplier);
}

export async function updateSupplier(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [updated] = await db
        .update(Suppliers)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(and(eq(Suppliers.uuid, uuid), isNull(Suppliers.deleted_at)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Supplier not found" });
    }
    return DataResponse(res, updated);
}

export async function deleteSupplier(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const [deleted] = await db
        .update(Suppliers)
        .set({ deleted_at: new Date() })
        .where(and(eq(Suppliers.uuid, uuid), isNull(Suppliers.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(204).send();
}