CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'cashier');--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "role" "user_role" DEFAULT 'cashier' NOT NULL;