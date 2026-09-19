import { pgTable, serial, varchar, timestamp, uuid, boolean, integer, numeric, text } from "drizzle-orm/pg-core";
import { Categories } from "./category.model";

export const Products = pgTable("Products", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    category_id: integer("category_id").notNull().references(() => Categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    image: varchar("image", { length: 255 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type Product = typeof Products.$inferSelect;
export type NewProduct = typeof Products.$inferInsert;