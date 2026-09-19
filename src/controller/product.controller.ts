import { Request, Response } from "express";
import { eq, isNull, and, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Products, Categories } from "../models";
import { createProductSchema, updateProductSchema } from "../utils/validators";
import { buildQueryOptions } from "../utils/queryHelper";
import { DataResponse, ListResponse } from "../utils/responseHelper";

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

    return DataResponse(res, product, 201);
}

export async function listProducts(req: Request, res: Response) {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

    const baseWhere = categoryId
        ? and(eq(Products.category_id, categoryId), isNull(Products.deleted_at))
        : isNull(Products.deleted_at);

    const { where, orderBy, limit, offset, with: withRelations, page } = buildQueryOptions(
        req.query as Record<string, unknown>,
        {
            columns: {
                name: Products.name,
                description: Products.description,
                price: Products.price,
                category_id: Products.category_id,
            },
            allowedRelations: ["category", "variants"],
            baseWhere,
            defaultOrderBy: [asc(Products.name)],
        }
    );

    const [products, [{ count }]] = await Promise.all([
        db.query.Products.findMany({ where, orderBy, limit, offset, with: withRelations }),
        db.select({ count: sql<number>`count(*)` }).from(Products).where(where),
    ]);

    return ListResponse(res, products, Number(count))
}

export async function getProduct(req: Request, res: Response) {
    const id = req.params.id as string;

    const product = await db.query.Products.findFirst({
        where: and(eq(Products.uuid, id), isNull(Products.deleted_at)),
        with: {
            variants: true,
            category: true
        },
    });

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    return DataResponse(res, product);
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
    return DataResponse(res, updated);
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