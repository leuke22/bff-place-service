import { pgTable, serial, timestamp, integer, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { Products } from "./product.model";
import { Ingredients } from "./ingredient.model";

export const ProductIngredients = pgTable(
    "ProductIngredients",
    {
        id: serial("id").primaryKey(),
        product_id: integer("product_id").notNull().references(() => Products.id, { onDelete: "cascade" }),
        ingredient_id: integer("ingredient_id").notNull().references(() => Ingredients.id, { onDelete: "restrict" }),
        quantity_used: numeric("quantity_used", { precision: 12, scale: 3 }).notNull(),
        created_at: timestamp("created_at").defaultNow().notNull(),
        updated_at: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("product_ingredients_product_ingredient_idx").on(table.product_id, table.ingredient_id),
    ]
);

export type ProductIngredient = typeof ProductIngredients.$inferSelect;
export type NewProductIngredient = typeof ProductIngredients.$inferInsert;