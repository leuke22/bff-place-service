import { Request, Response } from "express";
import { eq, isNull, and, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Categories, Products } from "../models";
import { createCategorySchema, updateCategorySchema } from "../utils/validators";
import { ListResponse } from "../utils/responseHelper";

export async function createCategory(req: Request, res: Response) {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [category] = await db.insert(Categories).values(parsed.data).returning();
    return res.status(201).json({ category });
}

export async function listCategories(req: Request, res: Response) {
    const [categories, [{ count }]] = await Promise.all([
        db.query.Categories.findMany({
            where: isNull(Categories.deleted_at),
            orderBy: (categories, { asc }) => [asc(categories.name)],
        }), 
        db.select({ count: sql<number>`count(*)` }).from(Categories).where(isNull(Categories.deleted_at)),
    ]);

    return ListResponse(res, categories, Number(count))
}

export async function listCategoryByProductCount(req: Request, res: Response) {
    const [categories, [{ count }]] = await Promise.all([
        db.select({
            id: Categories.id,
            uuid: Categories.uuid,
            name: Categories.name,
            image: Categories.image,
            icon: Categories.icon,
            description: Categories.description,
            color: Categories.color,
            is_active: Categories.is_active,
            created_at: Categories.created_at,
            // add any other Category columns you need here
            products_count: sql<number>`count(${Products.id})`.as("product_count"),
        })
        .from(Categories)
        .where(isNull(Categories.deleted_at))
        .groupBy(Categories.id)
        .orderBy(asc(Categories.name)),
        db.select({ count: sql<number>`count(*)` }).from(Categories).where(isNull(Categories.deleted_at))
    ])

    return ListResponse(res, categories, Number(count));
}

export async function getCategory(req: Request, res: Response) {
    const id = Number(req.params.id);
    const category = await db.query.Categories.findFirst({
        where: and(eq(Categories.id, id), isNull(Categories.deleted_at)),
    });

    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ category });
}

export async function updateCategory(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [updated] = await db
        .update(Categories)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(and(eq(Categories.id, id), isNull(Categories.deleted_at)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ category: updated });
}

export async function deleteCategory(req: Request, res: Response) {
    const id = Number(req.params.id);

    const [deleted] = await db
        .update(Categories)
        .set({ deleted_at: new Date() })
        .where(and(eq(Categories.id, id), isNull(Categories.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(204).send();
}