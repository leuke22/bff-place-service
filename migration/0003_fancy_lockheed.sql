ALTER TABLE "Categories" ALTER COLUMN "color" SET DEFAULT 'secondary';--> statement-breakpoint
ALTER TABLE "Categories" ADD COLUMN "icon" varchar(50) DEFAULT 'lucide:egg-fried' NOT NULL;