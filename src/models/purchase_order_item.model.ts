import { pgTable, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { PurchaseOrders } from "./purchase_order.model";
import { Ingredients } from "./ingredient.model";

export const PurchaseOrderItems = pgTable("PurchaseOrderItems", {
    id: serial("id").primaryKey(),
    purchase_order_id: integer("purchase_order_id").notNull().references(() => PurchaseOrders.id, { onDelete: "cascade" }),
    ingredient_id: integer("ingredient_id").notNull().references(() => Ingredients.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unit_cost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof PurchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof PurchaseOrderItems.$inferInsert;