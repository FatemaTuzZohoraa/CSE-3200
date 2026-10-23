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

// temporary check: confirm which database the backend uses
pool.query("SELECT current_database(), current_schema()")
    .then(result => console.log("[Database Check]", result.rows[0]))
    .catch(err => console.error("[Database Check Error]", err.message));

export default pool;