import { pgTable, serial, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";

export const tableStatusEnum = pgEnum("table_status", ["available", "occupied", "reserved"]);

export const Tables = pgTable("Tables", {
    id: serial("id").primaryKey(),
    table_number: varchar("table_number", { length: 20 }).notNull(),
    capacity: integer("capacity").notNull(),
    status: tableStatusEnum("status").default("available").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Table = typeof Tables.$inferSelect;
export type NewTable = typeof Tables.$inferInsert;