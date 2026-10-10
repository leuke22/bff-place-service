import { Request, Response } from "express";
import { eq, isNull, and, or, ilike, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Categories, Products, ProductCategories } from "../models";
import { createCategorySchema, updateCategorySchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

export async function createCategory(req: Request, res: Response) {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [category] = await db.insert(Categories).values(parsed.data).returning();
    return DataResponse(res, category);
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const conditions = [isNull(Categories.deleted_at)];
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = req.query.status;

    if (search) {
        conditions.push(or(
            ilike(Categories.name, `%${search}%`),
            ilike(Categories.description, `%${search}%`),
        )!);
    }
    if (status === "active") conditions.push(eq(Categories.is_active, true));
    if (status === "inactive") conditions.push(eq(Categories.is_active, false));

    const where = and(...conditions);
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
            products_count: sql<number>`cast(count(${Products.id}) as integer)`,
        })
        .from(Categories)
        .leftJoin(ProductCategories, eq(ProductCategories.category_id, Categories.id))
        .leftJoin(Products, and(
            eq(Products.id, ProductCategories.product_id),
            isNull(Products.deleted_at),
        ))
        .where(where)
        .groupBy(Categories.id)
        .orderBy(asc(Categories.name))
        .limit(limit)
        .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(Categories).where(where),
    ])

    return ListResponse(res, categories, Number(count));
}

export async function getCategory(req: Request, res: Response) {
    const id = req.params.id as string;

    const categories = await db.query.Categories.findFirst({
        where: and(eq(Categories.uuid, id), isNull(Categories.deleted_at)),
    });

    if (!categories) {
        return res.status(404).json({ message: "Categories not found" });
    }

    return DataResponse(res, categories);
}

export async function updateCategory(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const [updated] = await db
        .update(Categories)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(and(eq(Categories.uuid, uuid), isNull(Categories.deleted_at)))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: "Category not found" });
    }
    return DataResponse(res, updated);
}

export async function deleteCategory(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const [deleted] = await db
        .update(Categories)
        .set({ deleted_at: new Date() })
        .where(and(eq(Categories.uuid, uuid), isNull(Categories.deleted_at)))
        .returning();

    if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(204).send();
}
