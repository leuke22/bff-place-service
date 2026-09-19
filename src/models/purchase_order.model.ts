import { pgTable, serial, timestamp, integer, numeric, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { Suppliers } from "./supplier.model";
import { Users } from "./user.model";

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["pending", "ordered", "received", "cancelled"]);

export const PurchaseOrders = pgTable("PurchaseOrders", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    order_number: varchar("order_number", { length: 50 }).notNull(),
    supplier_id: integer("supplier_id").notNull().references(() => Suppliers.id, { onDelete: "restrict" }),
    status: purchaseOrderStatusEnum("status").default("pending").notNull(),
    total_cost: numeric("total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    ordered_by: integer("ordered_by").references(() => Users.id, { onDelete: "set null" }),
    ordered_at: timestamp("ordered_at"),
    received_at: timestamp("received_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PurchaseOrder = typeof PurchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof PurchaseOrders.$inferInsert;