ALTER TABLE "Tables" DISABLE ROW LEVEL SECURITY;

DROP TABLE "Tables" CASCADE;

ALTER TABLE "Orders" DROP COLUMN "table_id";

DROP TYPE "public"."table_status";