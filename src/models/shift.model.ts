import { pgTable, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { Users } from "./user.model";

export const Shifts = pgTable("Shifts", {
    id: serial("id").primaryKey(),
    cashier_id: integer("cashier_id").notNull().references(() => Users.id, { onDelete: "restrict" }),
    opening_cash: numeric("opening_cash", { precision: 12, scale: 2 }).notNull(),
    closing_cash: numeric("closing_cash", { precision: 12, scale: 2 }),
    expected_cash: numeric("expected_cash", { precision: 12, scale: 2 }),
    variance: numeric("variance", { precision: 12, scale: 2 }),
    opened_at: timestamp("opened_at").defaultNow().notNull(),
    closed_at: timestamp("closed_at"),
});

export type Shift = typeof Shifts.$inferSelect;
export type NewShift = typeof Shifts.$inferInsert;