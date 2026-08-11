import { pgTable, serial, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const Categories = pgTable("Categories", {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
});

export type Category = typeof Categories.$inferSelect;
export type NewCategory = typeof Categories.$inferInsert;