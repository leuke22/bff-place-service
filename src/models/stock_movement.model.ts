import { pgTable, serial, timestamp, integer, numeric, varchar, pgEnum } from "drizzle-orm/pg-core";
import { Ingredients } from "./ingredient.model";
import { Users } from "./user.model";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["in", "out", "adjustment"]);

export const StockMovements = pgTable("StockMovements", {
    id: serial("id").primaryKey(),
    ingredient_id: integer("ingredient_id").notNull().references(() => Ingredients.id, { onDelete: "restrict" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    reason: varchar("reason", { length: 255 }),
    reference_type: varchar("reference_type", { length: 50 }), // e.g. "order", "purchase_order", "manual"
    reference_id: integer("reference_id"), // the id of the order/purchase_order/etc that caused this movement
    created_by: integer("created_by").references(() => Users.id, { onDelete: "set null" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export type StockMovement = typeof StockMovements.$inferSelect;
export type NewStockMovement = typeof StockMovements.$inferInsert;