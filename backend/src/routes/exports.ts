import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/auth";
import { requireEventManager, requireClubPresident } from "../middleware/clubAuth";
import { sendExport, formatDhaka, ExportColumn } from "../utils/exportTable";

const router = express.Router();

const pickFormat = (value: any) => (value === "csv" ? "csv" : "pdf");

const paymentLabel = (row: any): string => {
    if (!row.payment_status) return "Free";
    const method = row.payment_method === "bkash" ? "bKash" : "Cash";
    const state: Record<string, string> = {
        success: "Verified", pending: "Awaiting check", failed: "Rejected", refunded: "Refunded"
    };
    return `${method} - ${state[row.payment_status] || row.payment_status}`;
};

/**
 * GET /api/events/:id/registrations/export?format=pdf|csv&include=confirmed|all
 * Default "confirmed" = registered + attended. "all" adds students whose
 * payment is still awaiting verification. Cancelled are never listed.
 */
router.get("/events/:id/registrations/export", authenticate, requireEventManager,
    async (req: Request, res: Response): Promise<any> => {
        try {
            const eventId = Number(req.params.id);
            const statuses = req.query.include === "all"
                ? ["registered", "attended", "pending_payment"]
                : ["registered", "attended"];

            const eventResult = await pool.query(
                `SELECT e.title, e.start_at, e.venue, c.name AS club_name
                 FROM events e
                 LEFT JOIN event_clubs ec ON ec.event_id = e.id AND ec.is_primary
                 LEFT JOIN clubs c ON c.id = ec.club_id
                 WHERE e.id = $1`,
                [eventId]
            );
            const event = eventResult.rows[0];

            const result = await pool.query(
                `SELECT r.status, u.name, u.email,
                        p.method AS payment_method, p.status AS payment_status
                 FROM event_registrations r
                 JOIN users u ON u.id = r.user_id
                 LEFT JOIN LATERAL (
                     SELECT * FROM payments WHERE registration_id = r.id
                     ORDER BY created_at DESC, id DESC LIMIT 1
                 ) p ON TRUE
                 WHERE r.event_id = $1 AND r.status = ANY($2::text[])
                 ORDER BY u.name ASC`,
                [eventId, statuses]
            );

            const columns: ExportColumn[] = [
                { header: "#", width: 30, get: (_r, i) => String(i + 1) },
                { header: "Name", width: 140, get: (r) => r.name },
                { header: "Email", width: 165, get: (r) => r.email },
                { header: "Status", width: 70, get: (r) => (r.status === "pending_payment" ? "Pending" : r.status) },
                { header: "Payment", width: 110, get: paymentLabel }
            ];

            return sendExport(res, pickFormat(req.query.format), {
                title: `${event.title} - Registrations`,
                subtitle: `${event.club_name || ""}  |  ${formatDhaka(event.start_at)}  |  ${event.venue}`,
                filename: `${event.title}-registrations`,
                columns,
                rows: result.rows
            });
        } catch (error) {
            console.error("[Export Registrations Error]", error);
            return res.status(500).json({ success: false, message: "Could not generate the list. Please try again." });
        }
    }
);

/** GET /api/clubs/:id/members/export?format=pdf|csv. Current (not left) members only. */
router.get("/clubs/:id/members/export", authenticate, requireClubPresident,
    async (req: Request, res: Response): Promise<any> => {
        try {
            const clubId = Number(req.params.id);

            const clubResult = await pool.query("SELECT name FROM clubs WHERE id = $1", [clubId]);
            if (clubResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Club not found" });
            }

            const result = await pool.query(
                `SELECT u.name, u.email, m.joined_at,
                        EXISTS (SELECT 1 FROM club_leaderships l
                                 WHERE l.club_id = m.club_id AND l.user_id = m.user_id
                                   AND l.ended_at IS NULL) AS is_president
                 FROM club_members m
                 JOIN users u ON u.id = m.user_id
                 WHERE m.club_id = $1 AND m.left_at IS NULL
                 ORDER BY is_president DESC, u.name ASC`,
                [clubId]
            );

            const columns: ExportColumn[] = [
                { header: "#", width: 30, get: (_r, i) => String(i + 1) },
                { header: "Name", width: 150, get: (r) => r.name },
                { header: "Email", width: 180, get: (r) => r.email },
                { header: "Role", width: 60, get: (r) => (r.is_president ? "President" : "Member") },
                { header: "Joined", width: 95, get: (r) => formatDhaka(r.joined_at).split(",")[0] }
            ];

            return sendExport(res, pickFormat(req.query.format), {
                title: `${clubResult.rows[0].name} - Member List`,
                subtitle: "Current members",
                filename: `${clubResult.rows[0].name}-members`,
                columns,
                rows: result.rows
            });
        } catch (error) {
            console.error("[Export Members Error]", error);
            return res.status(500).json({ success: false, message: "Could not generate the list. Please try again." });
        }
    }
);

export default router;