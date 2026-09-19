import { pgTable, serial, varchar, timestamp, uniqueIndex, integer, uuid } from "drizzle-orm/pg-core";
import { Users } from "./user.model";

export const RefreshTokens = pgTable(
    "RefreshTokens",
    {
        id: serial("id").primaryKey(),
        uuid: uuid("uuid").defaultRandom(),
        user_id: integer("user_id").notNull().references(() => Users.id, { onDelete: "cascade" }),
        token_hash: varchar("token_hash", { length: 255 }).notNull(),
        expires_at: timestamp("expires_at").notNull(),
        revoked_at: timestamp("revoked_at"),
        created_at: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("refresh_tokens_token_hash_idx").on(table.token_hash),
    ]
);

export type RefreshToken = typeof RefreshTokens.$inferSelect;
export type NewRefreshToken = typeof RefreshTokens.$inferInsert;