import { pgTable, serial, timestamp, integer, numeric, varchar } from "drizzle-orm/pg-core";
import { Orders } from "./order.model";
import { Products } from "./product.model";
import { ProductVariants } from "./product_variant.model";

export const OrderItems = pgTable("OrderItems", {
    id: serial("id").primaryKey(),
    order_id: integer("order_id").notNull().references(() => Orders.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => Products.id, { onDelete: "restrict" }),
    variant_id: integer("variant_id").references(() => ProductVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    notes: varchar("notes", { length: 255 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export type OrderItem = typeof OrderItems.$inferSelect;
export type NewOrderItem = typeof OrderItems.$inferInsert;