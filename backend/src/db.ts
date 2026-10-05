import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
    console.log("[Database] Connected successfully to PostgreSQL");
});

pool.on("error", (err: Error) => {
    console.error("[Database Error]", err.message);
});

export default pool;