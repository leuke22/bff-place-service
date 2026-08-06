import express from "express";
import cors from "cors";
import { env } from "./env";
import routes from "./routes";
import { checkDatabaseConnection } from "./db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api", routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

async function start() {
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
        console.error("Server not started — database connection failed.");
        process.exit(1);
    }

    const port = Number(env.PORT);
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

start();