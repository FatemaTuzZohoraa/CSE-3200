import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import clubRoutes from "./routes/clubs";
import adminClubRoutes from "./routes/adminClubs";
import eventRoutes from "./routes/events";
import membershipRoutes from "./routes/memberships";
import exportRoutes from "./routes/exports";

dotenv.config();

// Tokens are signed with JWT_SECRET. If it is missing, the code falls back to a
// secret that is public in the repo, and anyone could forge an admin token.
// Refuse to start instead.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error("[Server] JWT_SECRET is missing or too short (minimum 16 characters). Set it in backend/.env and restart.");
    process.exit(1);
}

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin/clubs", adminClubRoutes);
app.use("/api/events", eventRoutes);
// Membership applications: /api/clubs/:id/applications, /api/applications/mine, ...
// Every route inside carries its own authenticate, so nothing public is blocked.
app.use("/api", membershipRoutes);
app.use("/api", exportRoutes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "RUET Club Management API is running",
        timestamp: new Date().toISOString()
    });
});

// 404 Route Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "API Route not found"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`[Server] RUET Club Management backend running on http://localhost:${PORT}`);
});

