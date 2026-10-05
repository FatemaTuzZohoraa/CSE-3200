import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import clubRoutes from "./routes/clubs";
import adminClubRoutes from "./routes/adminClubs";

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin/clubs", adminClubRoutes);

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