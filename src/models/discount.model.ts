import { pgTable, serial, varchar, timestamp, uuid, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";

export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);

export const Discounts = pgTable("Discounts", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(), // e.g. "Senior Citizen"
    type: discountTypeEnum("type").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull(), // percent (0-100) or peso amount
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type Discount = typeof Discounts.$inferSelect;
export type NewDiscount = typeof Discounts.$inferInsert;
