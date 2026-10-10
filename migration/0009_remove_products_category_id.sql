ALTER TABLE "Products" DROP CONSTRAINT "Products_category_id_Categories_id_fk";
--> statement-breakpoint
ALTER TABLE "Products" DROP COLUMN "category_id";
