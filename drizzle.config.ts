import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/models/index.ts",
    out: "./migration",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});