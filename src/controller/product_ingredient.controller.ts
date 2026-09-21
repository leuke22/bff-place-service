import { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Products, Ingredients, ProductIngredients } from "../models";
import { addRecipeItemSchema, updateRecipeItemSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function addRecipeItem(req: Request, res: Response) {
    const productId = Number(req.params.productId);
    const parsed = addRecipeItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { ingredient_id, quantity_used } = parsed.data;

    const product = await db.query.Products.findFirst({ where: eq(Products.id, productId) });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const ingredient = await db.query.Ingredients.findFirst({ where: eq(Ingredients.id, ingredient_id) });
    if (!ingredient) {
        return res.status(400).json({ message: "ingredient_id does not reference an existing ingredient" });
    }

    const existing = await db.query.ProductIngredients.findFirst({
        where: and(eq(ProductIngredients.product_id, productId), eq(ProductIngredients.ingredient_id, ingredient_id)),
    });
    if (existing) {
        return res.status(409).json({ message: "This ingredient is already in the product's recipe. Use PATCH to update its quantity." });
    }

    const [item] = await db
        .insert(ProductIngredients)
        .values({ product_id: productId, ingredient_id, quantity_used: quantity_used.toFixed(3) })
        .returning();

    return DataResponse(res, item, 201);
}

export async function listRecipe(req: Request, res: Response) {
    const productId = Number(req.params.productId);

    const recipe = await db.query.ProductIngredients.findMany({
        where: eq(ProductIngredients.product_id, productId),
        with: { ingredient: true },
        orderBy: (pi, { asc }) => [asc(pi.created_at)],
    });

    return ListResponse(res, recipe, recipe.length);
}

export async function updateRecipeItem(req: Request, res: Response) {
    const productId = Number(req.params.productId);
    const ingredientId = Number(req.params.ingredientId);
    const parsed = updateRecipeItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [updated] = await db
        .update(ProductIngredients)
        .set({ quantity_used: parsed.data.quantity_used.toFixed(3), updated_at: new Date() })
        .where(and(eq(ProductIngredients.product_id, productId), eq(ProductIngredients.ingredient_id, ingredientId)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Recipe item not found" });
    }
    return DataResponse(res, updated);
}

export async function removeRecipeItem(req: Request, res: Response) {
    const productId = Number(req.params.productId);
    const ingredientId = Number(req.params.ingredientId);

    const deleted = await db
        .delete(ProductIngredients)
        .where(and(eq(ProductIngredients.product_id, productId), eq(ProductIngredients.ingredient_id, ingredientId)))
        .returning();

    if (deleted.length === 0) {
        return res.status(404).json({ message: "Recipe item not found" });
    }
    return res.status(204).send();
}