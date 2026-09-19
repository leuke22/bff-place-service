import { Request, Response } from "express";
import { eq, isNull, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Ingredients } from "../models";
import { createIngredientSchema, updateIngredientSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function createIngredient(req: Request, res: Response) {
    const parsed = createIngredientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { name, unit, current_stock, reorder_level } = parsed.data;

    const [ingredient] = await db
        .insert(Ingredients)
        .values({
            name,
            unit,
            current_stock: current_stock.toFixed(3),
            reorder_level: reorder_level.toFixed(3),
        })
        .returning();

    return DataResponse(res, ingredient, 201);
}

export async function listIngredients(req: Request, res: Response) {
    const lowStockOnly = req.query.low_stock === "true";
    const baseWhere = isNull(Ingredients.deleted_at);

    const [ingredients, [{ count }]] = await Promise.all([
        db.query.Ingredients.findMany({
            where: baseWhere,
            orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
        }),
        db.select({ count: sql<number>`count(*)` }).from(Ingredients).where(baseWhere),
    ]);

    const filtered = lowStockOnly
        ? ingredients.filter((i) => Number(i.current_stock) <= Number(i.reorder_level))
        : ingredients;

    return ListResponse(res, filtered, lowStockOnly ? filtered.length : Number(count));
}

export async function getIngredient(req: Request, res: Response) {
    const id = Number(req.params.id);
    const ingredient = await db.query.Ingredients.findFirst({
        where: and(eq(Ingredients.id, id), isNull(Ingredients.deleted_at)),
    });

    if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
    }
    return DataResponse(res, ingredient);
}

export async function updateIngredient(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateIngredientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const { current_stock, reorder_level, ...rest } = parsed.data;
    const updateValues: Record<string, unknown> = { ...rest, updated_at: new Date() };
    if (current_stock !== undefined) updateValues.current_stock = current_stock.toFixed(3);
    if (reorder_level !== undefined) updateValues.reorder_level = reorder_level.toFixed(3);

    const [updated] = await db
        .update(Ingredients)
        .set(updateValues)
        .where(and(eq(Ingredients.id, id), isNull(Ingredients.deleted_at)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Ingredient not found" });
    }
    return DataResponse(res, updated);
}

export async function deleteIngredient(req: Request, res: Response) {
    const id = Number(req.params.id);

    const [deleted] = await db
        .update(Ingredients)
        .set({ deleted_at: new Date() })
        .where(and(eq(Ingredients.id, id), isNull(Ingredients.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
    }
    return res.status(204).send();
}