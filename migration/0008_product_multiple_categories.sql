CREATE TABLE "ProductCategories" (
	"product_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "ProductCategories_product_id_category_id_pk" PRIMARY KEY("product_id", "category_id")
);
--> statement-breakpoint
ALTER TABLE "ProductCategories" ADD CONSTRAINT "ProductCategories_product_id_Products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."Products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ProductCategories" ADD CONSTRAINT "ProductCategories_category_id_Categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "product_categories_category_idx" ON "ProductCategories" USING btree ("category_id");
--> statement-breakpoint
INSERT INTO "ProductCategories" ("product_id", "category_id")
SELECT "id", "category_id" FROM "Products"
ON CONFLICT DO NOTHING;
