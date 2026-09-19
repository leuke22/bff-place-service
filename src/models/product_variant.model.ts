import { pgTable, serial, varchar, timestamp, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { Products } from "./product.model";

export const ProductVariants = pgTable("ProductVariants", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    product_id: integer("product_id").notNull().references(() => Products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    price_override: numeric("price_override", { precision: 10, scale: 2 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type ProductVariant = typeof ProductVariants.$inferSelect;
export type NewProductVariant = typeof ProductVariants.$inferInsert;