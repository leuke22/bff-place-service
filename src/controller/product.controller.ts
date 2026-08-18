import { Request, Response } from "express";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Products, Categories } from "../models";
import { createProductSchema, updateProductSchema } from "../utils/validators";

export async function createProduct(req: Request, res: Response) {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { category_id, name, description, price, image } = parsed.data;

    const category = await db.query.Categories.findFirst({
        where: and(eq(Categories.id, category_id), isNull(Categories.deleted_at)),
    });
    if (!category) {
        return res.status(400).json({ message: "category_id does not reference an existing category" });
    }

    const [product] = await db
        .insert(Products)
        .values({ category_id, name, description, price: price.toFixed(2), image })
        .returning();

    return res.status(201).json({ product });
}

export async function listProducts(req: Request, res: Response) {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

    const products = await db.query.Products.findMany({
        where: categoryId
            ? and(eq(Products.category_id, categoryId), isNull(Products.deleted_at))
            : isNull(Products.deleted_at),
        orderBy: (products, { asc }) => [asc(products.name)],
    });

    return res.json({ products });
}

export async function getProduct(req: Request, res: Response) {
    const id = Number(req.params.id);

    const product = await db.query.Products.findFirst({
        where: and(eq(Products.id, id), isNull(Products.deleted_at)),
        with: {
            variants: true,
        },
    });

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ product });
}

export async function updateProduct(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const { price, ...rest } = parsed.data;
    const updateValues: Record<string, unknown> = { ...rest, updated_at: new Date() };
    if (price !== undefined) {
        updateValues.price = price.toFixed(2);
    }

    const [updated] = await db
        .update(Products)
        .set(updateValues)
        .where(and(eq(Products.id, id), isNull(Products.deleted_at)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ product: updated });
}

export async function deleteProduct(req: Request, res: Response) {
    const id = Number(req.params.id);

    const [deleted] = await db
        .update(Products)
        .set({ deleted_at: new Date() })
        .where(and(eq(Products.id, id), isNull(Products.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
    }
    return res.status(204).send();
}