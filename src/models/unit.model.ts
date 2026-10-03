import { pgTable, serial, varchar, timestamp, uuid, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const Units = pgTable(
    "Units",
    {
        id: serial("id").primaryKey(),
        uuid: uuid("uuid").defaultRandom(),
        name: varchar("name", { length: 50 }).notNull(), // e.g. "Kilogram"
        symbol: varchar("symbol", { length: 10 }).notNull(), // e.g. "kg" — this is what Ingredients.unit stores
        is_active: boolean("is_active").default(true).notNull(),
        created_at: timestamp("created_at").defaultNow().notNull(),
        updated_at: timestamp("updated_at").defaultNow().notNull(),
        deleted_at: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("units_symbol_idx").on(table.symbol),
    ]
);

export type Unit = typeof Units.$inferSelect;
export type NewUnit = typeof Units.$inferInsert;