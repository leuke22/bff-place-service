CREATE TYPE "public"."stock_movement_type" AS ENUM('in', 'out', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('pending', 'ordered', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'takeout');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'gcash', 'card', 'bank_transfer');--> statement-breakpoint
CREATE TABLE "Users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar" varchar(255),
	"password" varchar(255) NOT NULL,
	"is_active" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "RefreshTokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"user_id" integer NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "Products" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"category_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ProductVariants" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"product_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"price_override" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "Ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"name" varchar(150) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"current_stock" numeric(12, 3) DEFAULT '0' NOT NULL,
	"reorder_level" numeric(12, 3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ProductIngredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity_used" numeric(12, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StockMovements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"reason" varchar(255),
	"reference_type" varchar(50),
	"reference_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"name" varchar(150) NOT NULL,
	"contact_person" varchar(150),
	"contact_number" varchar(30),
	"email" varchar(255),
	"address" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "PurchaseOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"order_number" varchar(50) NOT NULL,
	"supplier_id" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'pending' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"ordered_by" integer,
	"ordered_at" timestamp,
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PurchaseOrderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit_cost" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"capacity" integer NOT NULL,
	"status" "table_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"order_number" varchar(50) NOT NULL,
	"order_type" "order_type" NOT NULL,
	"table_id" integer,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"cashier_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount_tendered" numeric(12, 2) NOT NULL,
	"change" numeric(12, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"cashier_id" integer NOT NULL,
	"opening_cash" numeric(12, 2) NOT NULL,
	"closing_cash" numeric(12, 2),
	"expected_cash" numeric(12, 2),
	"variance" numeric(12, 2),
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_user_id_Users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Products" ADD CONSTRAINT "Products_category_id_Categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProductVariants" ADD CONSTRAINT "ProductVariants_product_id_Products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."Products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProductIngredients" ADD CONSTRAINT "ProductIngredients_product_id_Products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."Products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProductIngredients" ADD CONSTRAINT "ProductIngredients_ingredient_id_Ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."Ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StockMovements" ADD CONSTRAINT "StockMovements_ingredient_id_Ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."Ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StockMovements" ADD CONSTRAINT "StockMovements_created_by_Users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."Users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrders" ADD CONSTRAINT "PurchaseOrders_supplier_id_Suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."Suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrders" ADD CONSTRAINT "PurchaseOrders_ordered_by_Users_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."Users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrderItems" ADD CONSTRAINT "PurchaseOrderItems_purchase_order_id_PurchaseOrders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."PurchaseOrders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PurchaseOrderItems" ADD CONSTRAINT "PurchaseOrderItems_ingredient_id_Ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."Ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_table_id_Tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."Tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_cashier_id_Users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."Users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_order_id_Orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."Orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_product_id_Products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."Products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_variant_id_ProductVariants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."ProductVariants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_order_id_Orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."Orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Shifts" ADD CONSTRAINT "Shifts_cashier_id_Users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."Users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "Users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "RefreshTokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ingredients_product_ingredient_idx" ON "ProductIngredients" USING btree ("product_id","ingredient_id");