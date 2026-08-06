import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../models";
import { env } from "../env";

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

pool.on("connect", () => {
    console.log("New database connection established");
});

pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle({ client: pool, schema });

export async function checkDatabaseConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        client.release();
        console.log(`Database connected successfully — server time: ${result.rows[0].now}`);
        return true;
    } catch (err) {
        console.error("Failed to connect to the database:", (err as Error).message);
        return false;
    }
}