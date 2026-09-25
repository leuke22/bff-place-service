import { Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Ingredients, StockMovements } from "../models";
import { createStockMovementSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function createStockMovement(req: Request, res: Response) {
    const parsed = createStockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { ingredient_id, type, quantity, reason, reference_type, reference_id } = parsed.data;
    const userId = req.user!.user_id;

    try {
        const result = await db.transaction(async (tx) => {
            const ingredient = await tx.query.Ingredients.findFirst({
                where: eq(Ingredients.id, ingredient_id),
            });
            if (!ingredient) {
                throw new Error("INGREDIENT_NOT_FOUND");
            }

            const current = Number(ingredient.current_stock);
            let newStock: number;

            if (type === "in") {
                newStock = current + quantity;
            } else if (type === "out") {
                newStock = current - quantity;
                if (newStock < 0) {
                    throw new Error("INSUFFICIENT_STOCK");
                }
            } else {
                // adjustment: quantity is the new absolute stock level (e.g. from a physical count),
                // not a delta — this matches how stocktake corrections are normally recorded.
                newStock = quantity;
            }

            const [movement] = await tx
                .insert(StockMovements)
                .values({
                    ingredient_id,
                    type,
                    quantity: quantity.toFixed(3),
                    reason,
                    reference_type,
                    reference_id,
                    created_by: userId,
                })
                .returning();

            const [updatedIngredient] = await tx
                .update(Ingredients)
                .set({ current_stock: newStock.toFixed(3), updated_at: new Date() })
                .where(eq(Ingredients.id, ingredient_id))
                .returning();

            return { movement, ingredient: updatedIngredient };
        });

        return DataResponse(res, result, 201);
    } catch (err: any) {
        if (err.message === "INGREDIENT_NOT_FOUND") {
            return res.status(400).json({ message: "ingredient_id does not reference an existing ingredient" });
        }
        if (err.message === "INSUFFICIENT_STOCK") {
            return res.status(400).json({ message: "Insufficient stock for this outgoing movement" });
        }
        console.error(err);
        return res.status(500).json({ message: "Failed to record stock movement" });
    }
}

export async function listStockMovements(req: Request, res: Response) {
    const ingredientId = req.query.ingredient_id ? Number(req.query.ingredient_id) : undefined;
    const baseWhere = ingredientId ? eq(StockMovements.ingredient_id, ingredientId) : undefined;

    const [movements, [{ count }]] = await Promise.all([
        db.query.StockMovements.findMany({
            where: baseWhere,
            orderBy: (sm, { desc }) => [desc(sm.created_at)],
            with: { ingredient: true },
        }),
        db.select({ count: sql<number>`count(*)` }).from(StockMovements).where(baseWhere),
    ]);

    return ListResponse(res, movements, Number(count));
}