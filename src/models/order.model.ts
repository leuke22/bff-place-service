import { pgTable, serial, varchar, timestamp, integer, numeric, uuid, pgEnum } from "drizzle-orm/pg-core";
import { Tables } from "./table.model";
import { Users } from "./user.model";

export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeout"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "preparing", "ready", "completed", "cancelled"]);

export const Orders = pgTable("Orders", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    order_number: varchar("order_number", { length: 50 }).notNull(),
    order_type: orderTypeEnum("order_type").notNull(),
    table_id: integer("table_id").references(() => Tables.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").default("pending").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    cashier_id: integer("cashier_id").notNull().references(() => Users.id, { onDelete: "restrict" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof Orders.$inferSelect;
export type NewOrder = typeof Orders.$inferInsert;