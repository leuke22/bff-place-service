CREATE TABLE "Users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100) NOT NULL,
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
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_user_id_Users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "Users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "RefreshTokens" USING btree ("token_hash");