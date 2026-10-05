import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";

/**
 * SHARED SECRET
 * The auth system (routes/auth.ts) signs tokens with process.env.JWT_SECRET.
 * We must use the exact same secret to read them, so both read it the same way.
 */
const getJwtSecret = () => process.env.JWT_SECRET || "fallback_ruet_jwt_secret";

/**
 * authenticate
 * Reads the JWT that /api/auth/login returned, checks it is valid, then loads
 * the matching row from `users` and attaches it to req.user.
 *
 * WHY we re-read the user from the database instead of trusting the token body:
 * the token payload is signed, so it cannot be edited, but it can become old.
 * If an admin demotes someone, the database is the source of truth. Reading the
 * role fresh on every request means an old token cannot keep admin powers.
 */
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // 1. The token arrives in the "Authorization: Bearer <token>" header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in."
            });
        }

        const token = authHeader.substring("Bearer ".length);

        // 2. Verify the signature and expiry. Throws if the token is fake or old.
        let tokenData: any;
        try {
            tokenData = jwt.verify(token, getJwtSecret());
        } catch (verifyError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired session. Please log in again."
            });
        }

        // 3. Load the real user row so role and id come from the database
        const userResult = await pool.query(
            `SELECT id, name, email, role
             FROM users
             WHERE id = $1`,
            [tokenData.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Account no longer exists. Please log in again."
            });
        }

        // 4. Attach the user. Handlers now use req.user.id — never a body value.
        req.user = userResult.rows[0];

        next();

    } catch (error) {
        console.error("[Auth Middleware Error]", error);
        return res.status(500).json({
            success: false,
            message: "Server error while verifying your session."
        });
    }
};

/**
 * requireAdmin
 * Must always be placed AFTER `authenticate`. Checks the role that the
 * middleware just loaded from the database. A student calling an admin route by
 * hand still gets blocked here, no matter what the frontend hides.
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access required."
        });
    }

    next();
};

export { authenticate, requireAdmin };