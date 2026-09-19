import { pgTable, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { Orders } from "./order.model";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "gcash", "card", "bank_transfer"]);

export const Payments = pgTable("Payments", {
    id: serial("id").primaryKey(),
    order_id: integer("order_id").notNull().references(() => Orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    amount_tendered: numeric("amount_tendered", { precision: 12, scale: 2 }).notNull(),
    change: numeric("change", { precision: 12, scale: 2 }).default("0").notNull(),
    paid_at: timestamp("paid_at").defaultNow().notNull(),
});

export type Payment = typeof Payments.$inferSelect;
export type NewPayment = typeof Payments.$inferInsert;