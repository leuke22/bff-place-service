import { pgTable, serial, varchar, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";

export const Users = pgTable(
    "Users",
    {
        id: serial("id").primaryKey(),
        first_name: varchar("first_name", { length: 100 }).notNull(),
        middle_name: varchar("middle_name", { length: 100 }).notNull(),
        last_name: varchar("last_name", { length: 100 }).notNull(),
        email: varchar("email", { length: 255 }).notNull(),
        avatar: varchar("avatar", { length: 255 }),
        password: varchar("password", { length: 255 }).notNull(),
        is_active: boolean("is_active"),
        created_at: timestamp("created_at").defaultNow().notNull(),
        updated_at: timestamp("updated_at").defaultNow().notNull(),
        deleted_at: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("users_email_idx").on(table.email),
    ]
);

export type User = typeof Users.$inferSelect;
export type NewUser = typeof Users.$inferInsert;