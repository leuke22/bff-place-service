import { pgTable, serial, varchar, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

export const Ingredients = pgTable("Ingredients", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(), // e.g. "kg", "pcs", "L", "g"
    current_stock: numeric("current_stock", { precision: 12, scale: 3 }).default("0").notNull(),
    reorder_level: numeric("reorder_level", { precision: 12, scale: 3 }).default("0").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type Ingredient = typeof Ingredients.$inferSelect;
export type NewIngredient = typeof Ingredients.$inferInsert;