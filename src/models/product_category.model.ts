import { pgTable, integer, index, primaryKey } from "drizzle-orm/pg-core";
import { Products } from "./product.model";
import { Categories } from "./category.model";

export const ProductCategories = pgTable("ProductCategories", {
    product_id: integer("product_id").notNull().references(() => Products.id, { onDelete: "cascade" }),
    category_id: integer("category_id").notNull().references(() => Categories.id, { onDelete: "cascade" }),
}, (table) => [
    primaryKey({ columns: [table.product_id, table.category_id] }),
    index("product_categories_category_idx").on(table.category_id),
]);

export type ProductCategory = typeof ProductCategories.$inferSelect;
