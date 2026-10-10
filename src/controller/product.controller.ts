import { Request, Response } from "express";
import { eq, isNull, and, asc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Products, Categories, ProductCategories } from "../models";
import { createProductSchema, updateProductSchema } from "../utils/validators";
import { buildQueryOptions } from "../utils/queryHelper";
import { DataResponse, ListResponse } from "../utils/responseHelper";

async function includeProductCategories<T extends { id: number }>(products: T[]) {
    if (!products.length) return products.map((product) => ({ ...product, categories: [] }));

    const links = await db.select({
        product_id: ProductCategories.product_id,
        category: Categories,
    })
        .from(ProductCategories)
        .innerJoin(Categories, eq(ProductCategories.category_id, Categories.id))
        .where(and(
            inArray(ProductCategories.product_id, products.map((product) => product.id)),
            isNull(Categories.deleted_at),
        ));

    const categoriesByProduct = new Map<number, (typeof links)[number]["category"][]>();
    for (const link of links) {
        const categories = categoriesByProduct.get(link.product_id) ?? [];
        categories.push(link.category);
        categoriesByProduct.set(link.product_id, categories);
    }

    return products.map((product) => ({
        ...product,
        categories: categoriesByProduct.get(product.id) ?? [],
    }));
}

async function categoriesExist(categoryIds: number[]) {
    const categories = await db.query.Categories.findMany({
        where: and(inArray(Categories.id, categoryIds), isNull(Categories.deleted_at)),
        columns: { id: true },
    });
    return categories.length === categoryIds.length;
}

export async function createProduct(req: Request, res: Response) {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const categoryIds = parsed.data.category_ids!;
    if (!(await categoriesExist(categoryIds))) {
        return res.status(400).json({ message: "One or more categories do not exist or are deleted" });
    }

    const { name, description, price, image } = parsed.data;
    const product = await db.transaction(async (tx) => {
        const [created] = await tx
            .insert(Products)
            .values({ name, description, price: price.toFixed(2), image })
            .returning();

        await tx.insert(ProductCategories).values(categoryIds.map((category_id) => ({
            product_id: created.id,
            category_id,
        })));
        return created;
    });

    const [productWithCategories] = await includeProductCategories([product]);
    return DataResponse(res, productWithCategories, 201);
}

export async function listProducts(req: Request, res: Response) {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

    const baseWhere = categoryId
        ? and(inArray(
            Products.id,
            db.select({ product_id: ProductCategories.product_id })
                .from(ProductCategories)
                .where(eq(ProductCategories.category_id, categoryId)),
        ), isNull(Products.deleted_at))
        : isNull(Products.deleted_at);

    const { where, orderBy, limit, offset, with: withRelations, page } = buildQueryOptions(
        req.query as Record<string, unknown>,
        {
            columns: {
                name: Products.name,
                description: Products.description,
                price: Products.price,
            },
            allowedRelations: ["variants", "ingredients"],
            baseWhere,
            defaultOrderBy: [asc(Products.name)],
        }
    );

    const [products, [{ count }]] = await Promise.all([
        db.query.Products.findMany({ where, orderBy, limit, offset, with: withRelations }),
        db.select({ count: sql<number>`count(*)` }).from(Products).where(where),
    ]);

    return ListResponse(res, await includeProductCategories(products), Number(count))
}

export async function getProduct(req: Request, res: Response) {
    const id = req.params.id as string;

    const product = await db.query.Products.findFirst({
        where: and(eq(Products.uuid, id), isNull(Products.deleted_at)),
        with: {
            variants: true,
        },
    });

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    const [productWithCategories] = await includeProductCategories([product]);
    return DataResponse(res, productWithCategories);
}

export async function updateProduct(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const { category_ids, price, ...rest } = parsed.data;
    const selectedCategoryIds = category_ids;
    if (selectedCategoryIds && !(await categoriesExist(selectedCategoryIds))) {
        return res.status(400).json({ message: "One or more categories do not exist or are deleted" });
    }

    const updateValues: Record<string, unknown> = { ...rest, updated_at: new Date() };
    if (price !== undefined) {
        updateValues.price = price.toFixed(2);
    }

    const updated = await db.transaction(async (tx) => {
        const [product] = await tx
            .update(Products)
            .set(updateValues)
            .where(and(eq(Products.id, id), isNull(Products.deleted_at)))
            .returning();

        if (!product || !selectedCategoryIds) return product;

        await tx.delete(ProductCategories).where(eq(ProductCategories.product_id, id));
        await tx.insert(ProductCategories).values(selectedCategoryIds.map((category_id) => ({
            product_id: id,
            category_id,
        })));
        return product;
    });

    if (!updated) {
        return res.status(404).json({ message: "Product not found" });
    }
    const [productWithCategories] = await includeProductCategories([updated]);
    return DataResponse(res, productWithCategories);
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
