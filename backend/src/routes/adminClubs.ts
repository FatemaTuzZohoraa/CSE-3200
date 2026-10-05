import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Every route in this file needs a valid login AND role = 'admin'.
router.use(authenticate, requireAdmin);

const cleanText = (value: any): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

/**
 * GET /api/admin/clubs
 * Review queue for the DSW / admin.
 *
 * With no query it returns pending clubs, which is the default review screen.
 * Pass ?status=approved or ?status=rejected to look at the other buckets.
 */
router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
        const requestedStatus = cleanText(req.query.status) || "pending";
        const allowedStatuses = ["pending", "approved", "rejected", "suspended"];

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: pending, approved, rejected, suspended"
            });
        }

        const result = await pool.query(
            // The "submitted_by" columns come from the oldest submitted history
            // row, which is the original creator. A club can only have one
            // creator, so this subquery always matches at most one row.
            `SELECT c.id, c.name, c.description, c.category, c.logo_url,
                    c.advisor_name, c.advisor_email, c.advisor_department,
                    c.status, c.created_at,
                    u.name AS submitted_by_name,
                    u.email AS submitted_by_email
             FROM clubs c
             LEFT JOIN LATERAL (
                 SELECT h.acted_by
                 FROM club_status_history h
                 WHERE h.club_id = c.id AND h.action IN ('submitted', 'resubmitted')
                 ORDER BY h.created_at ASC, h.id ASC
                 LIMIT 1
             ) first_submission ON TRUE
             LEFT JOIN users u ON u.id = first_submission.acted_by
             WHERE c.status = $1
             ORDER BY c.created_at ASC`,
            [requestedStatus]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} ${requestedStatus} club(s) found`,
            clubs: result.rows
        });

    } catch (error) {
        console.error("[Admin List Clubs Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load the review queue. Please try again."
        });
    }
});

/**
 * GET /api/admin/clubs/:id
 * Full submission detail for review, including the full status history.
 * Admins can see any status here, not just approved ones.
 */
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club id"
            });
        }

        const clubResult = await pool.query(
            `SELECT c.id, c.name, c.description, c.category, c.logo_url,
                    c.advisor_name, c.advisor_email, c.advisor_department,
                    c.status, c.created_at,
                    (SELECT COUNT(*) FROM club_members m
                      WHERE m.club_id = c.id AND m.left_at IS NULL) AS members_count
             FROM clubs c
             WHERE c.id = $1`,
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // The audit trail. Ordered oldest first so it reads as a timeline.
        const historyResult = await pool.query(
            `SELECT h.id, h.action, h.comment, h.created_at,
                    u.name AS acted_by_name, u.role AS acted_by_role
             FROM club_status_history h
             JOIN users u ON u.id = h.acted_by
             WHERE h.club_id = $1
             ORDER BY h.created_at ASC, h.id ASC`,
            [clubId]
        );

        return res.json({
            success: true,
            message: "Club found",
            club: clubResult.rows[0],
            history: historyResult.rows
        });

    } catch (error) {
        console.error("[Admin Club Detail Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load this club. Please try again."
        });
    }
});

/**
 * POST /api/admin/clubs/:id/approve
 * pending -> approved, then append an 'approved' history row.
 */
router.post("/:id/approve", async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const clubId = Number(req.params.id);
        const adminId = req.user!.id;
        const comment = cleanText(req.body?.comment);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club id"
            });
        }

        await client.query("BEGIN");

        // Lock the row, then only allow the pending -> approved step.
        const clubResult = await client.query(
            `UPDATE clubs
             SET status = 'approved'
             WHERE id = $1 AND status = 'pending'
             RETURNING id, name, status`,
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            // Either no such club, or it was not pending. Find out which.
            await client.query("ROLLBACK");

            const exists = await pool.query("SELECT status FROM clubs WHERE id = $1", [clubId]);

            if (exists.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Club not found"
                });
            }

            return res.status(409).json({
                success: false,
                message: `This club is already "${exists.rows[0].status}" and cannot be approved again.`
            });
        }

        // Append to history. Existing rows are never touched.
        await client.query(
            `INSERT INTO club_status_history (club_id, acted_by, action, comment)
             VALUES ($1, $2, 'approved', $3)`,
            [clubId, adminId, comment || "Approved by administrator"]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: `"${clubResult.rows[0].name}" has been approved and is now publicly visible.`,
            club: clubResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[Approve Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not approve this club. Please try again."
        });

    } finally {
        client.release();
    }
});

/**
 * POST /api/admin/clubs/:id/reject
 * pending -> rejected, then append a 'rejected' history row holding the reason.
 * The reason is what the student later reads on their My Submissions page.
 */
router.post("/:id/reject", async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const clubId = Number(req.params.id);
        const adminId = req.user!.id;
        const comment = cleanText(req.body?.comment);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club id"
            });
        }

        // A rejection without a reason is not useful to the student, so it is required.
        if (!comment) {
            return res.status(400).json({
                success: false,
                message: "A rejection reason is required"
            });
        }

        await client.query("BEGIN");

        const clubResult = await client.query(
            `UPDATE clubs
             SET status = 'rejected'
             WHERE id = $1 AND status = 'pending'
             RETURNING id, name, status`,
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            await client.query("ROLLBACK");

            const exists = await pool.query("SELECT status FROM clubs WHERE id = $1", [clubId]);

            if (exists.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Club not found"
                });
            }

            return res.status(409).json({
                success: false,
                message: `This club is already "${exists.rows[0].status}" and cannot be rejected again.`
            });
        }

        await client.query(
            `INSERT INTO club_status_history (club_id, acted_by, action, comment)
             VALUES ($1, $2, 'rejected', $3)`,
            [clubId, adminId, comment]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: `"${clubResult.rows[0].name}" has been rejected. The student can now see your reason.`,
            club: clubResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[Reject Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not reject this club. Please try again."
        });

    } finally {
        client.release();
    }
});

export default router;