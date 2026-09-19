import { pgTable, serial, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const Suppliers = pgTable("Suppliers", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    contact_person: varchar("contact_person", { length: 150 }),
    contact_number: varchar("contact_number", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: varchar("address", { length: 255 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type Supplier = typeof Suppliers.$inferSelect;
export type NewSupplier = typeof Suppliers.$inferInsert;