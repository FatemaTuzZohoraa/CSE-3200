import express, { Request, Response, NextFunction } from "express";
import { PoolClient } from "pg";
import pool from "../db";
import { authenticate } from "../middleware/auth";
import { requireClubPresident } from "../middleware/clubAuth";

const router = express.Router();

const cleanText = (value: any): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

// bKash transaction IDs are letters + digits. Stored UPPERCASE so the UNIQUE
// column also catches "8n7a6d5ee1" vs "8N7A6D5EE1".
const BKASH_TRX_REGEX = /^[A-Z0-9]{6,20}$/;

// Bangladeshi mobile number, e.g. 01712345678 (a leading +88 / 88 is stripped first)
const BD_MOBILE_REGEX = /^01[3-9]\d{8}$/;
const normalizeBdMobile = (value: string) => value.replace(/[\s-]/g, "").replace(/^\+?88/, "");


/**
 * markPaymentSuccess
 * The ONE place a membership payment becomes "success".
 * Today the club president triggers it after checking the transaction in their
 * own bKash app (or receiving cash). When a bKash payment gateway is added, its
 * webhook calls this same function with verifiedBy = null, and nothing else in
 * this file has to change.
 */
const markPaymentSuccess = async (client: PoolClient, applicationId: number, verifiedBy: number | null) => {
    await client.query(
        `UPDATE payments
         SET status = 'success', verified_by = $2, verified_at = NOW(), paid_at = NOW()
         WHERE membership_application_id = $1 AND status = 'pending'`,
        [applicationId, verifiedBy]
    );
};

const markPaymentFailed = async (client: PoolClient, applicationId: number, verifiedBy: number | null) => {
    await client.query(
        `UPDATE payments
         SET status = 'failed', verified_by = $2, verified_at = NOW()
         WHERE membership_application_id = $1 AND status = 'pending'`,
        [applicationId, verifiedBy]
    );
};

/**
 * GET /api/clubs/:id/membership-info
 * Everything the "Apply" form needs: the fee, where to send bKash money, and
 * whether this student is already a member or has an application waiting.
 * The club's president also gets the saved bKash number while the fee is 0, so
 * the settings form can show it.
 */
router.get("/clubs/:id/membership-info", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({ success: false, message: "Invalid club id" });
        }

        const userId = req.user!.id;

        const clubResult = await pool.query(
            `SELECT id, name, status, membership_fee, bkash_number FROM clubs WHERE id = $1`,
            [clubId]
        );

        if (clubResult.rows.length === 0 || clubResult.rows[0].status !== "approved") {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const club = clubResult.rows[0];
        const fee = Number(club.membership_fee);

        const [memberResult, pendingResult, leaderResult] = await Promise.all([
            pool.query(
                `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2 AND left_at IS NULL`,
                [clubId, userId]
            ),
            pool.query(
                `SELECT 1 FROM membership_applications
                 WHERE club_id = $1 AND user_id = $2 AND status = 'pending'`,
                [clubId, userId]
            ),
            pool.query(
                `SELECT 1 FROM club_leaderships
                 WHERE club_id = $1 AND user_id = $2 AND ended_at IS NULL`,
                [clubId, userId]
            )
        ]);

        let myStatus = "none";
        if (memberResult.rows.length > 0) myStatus = "member";
        else if (pendingResult.rows.length > 0) myStatus = "pending";

        return res.json({
            success: true,
            message: "Membership info loaded",
            club: {
                id: club.id,
                name: club.name,
                membership_fee: fee,
                accepts_bkash: Boolean(club.bkash_number),
                bkash_number: fee > 0 || leaderResult.rows.length > 0 ? club.bkash_number : null
            },
            my_status: myStatus,
            is_president: leaderResult.rows.length > 0
        });

    } catch (error) {
        console.error("[Membership Info Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load the membership details. Please try again."
        });
    }
});

/**
 * POST /api/clubs/:id/applications
 * A student applies to join an approved club.
 *
 * Body: motivation (required), experience (optional), phone (optional)
 *       and, only when the club charges a fee:
 *       payment_method = "bkash" | "cash", transaction_id (bkash only)
 *
 * The application and its payment row are written together (all or nothing).
 * The amount is copied from the club's fee right now, so a later fee change
 * never alters an existing application.
 */
router.post("/clubs/:id/applications", authenticate, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({ success: false, message: "Invalid club id" });
        }

        const userId = req.user!.id;
        const body = req.body || {};

        // 1. The club must exist and be approved
        const clubResult = await pool.query(
            `SELECT id, name, status, membership_fee, bkash_number FROM clubs WHERE id = $1`,
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const club = clubResult.rows[0];

        if (club.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "This club is not accepting applications right now."
            });
        }

        // 2. Validate the form
        const errors: string[] = [];

        const motivation = cleanText(body.motivation);
        const experience = cleanText(body.experience);

        if (!motivation) {
            errors.push("Please tell the club why you want to join");
        } else if (motivation.length > 1000) {
            errors.push("Your reason must be 1000 characters or fewer");
        }

        if (experience && experience.length > 1000) {
            errors.push("Your experience must be 1000 characters or fewer");
        }

        // Optional contact number (the leader may use it to arrange a cash payment)
        const rawPhone = cleanText(body.phone);
        let phone: string | null = null;

        if (rawPhone) {
            const normalizedPhone = normalizeBdMobile(rawPhone);

            if (!BD_MOBILE_REGEX.test(normalizedPhone)) {
                errors.push("Enter a valid mobile number, like 01712345678");
            } else {
                phone = normalizedPhone;
            }
        }

        // Payment fields only matter when the club charges a fee
        const fee = Number(club.membership_fee);
        let paymentMethod: string | null = null;
        let transactionId: string | null = null;

        if (fee > 0) {
            paymentMethod = (cleanText(body.payment_method) || "").toLowerCase();

            if (paymentMethod !== "bkash" && paymentMethod !== "cash") {
                errors.push("Choose a payment method: bKash or cash");
            } else if (paymentMethod === "bkash") {
                transactionId = (cleanText(body.transaction_id) || "").toUpperCase();

                if (!club.bkash_number) {
                    errors.push("This club does not accept bKash. Please choose cash.");
                } else if (!BKASH_TRX_REGEX.test(transactionId)) {
                    errors.push("Enter the bKash transaction ID (letters and numbers only)");
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        // 3. Already an active member? (the president counts as a member too)
        const memberResult = await pool.query(
            `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2 AND left_at IS NULL`,
            [clubId, userId]
        );

        if (memberResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You are already a member of "${club.name}".`
            });
        }

        // 4. Write application + payment together
        await client.query("BEGIN");

        const applicationResult = await client.query(
            `INSERT INTO membership_applications (club_id, user_id, motivation, experience, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, club_id, status, created_at`,
            [clubId, userId, motivation, experience, phone]
        );

        const application = applicationResult.rows[0];

        if (fee > 0) {
            await client.query(
                `INSERT INTO payments (membership_application_id, amount, method, transaction_id)
                 VALUES ($1, $2, $3, $4)`,
                [application.id, club.membership_fee, paymentMethod, transactionId]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: fee > 0
                ? `Your application to "${club.name}" was sent. The club president will verify your payment and review it.`
                : `Your application to "${club.name}" was sent. The club president will review it.`,
            application: { ...application, payment_method: paymentMethod, amount: fee }
        });

    } catch (error: any) {
        await client.query("ROLLBACK");

        // 23505 = unique_violation. Two different rules can trigger it:
        if (error?.code === "23505") {
            if (error.constraint === "one_pending_application_per_student_club") {
                return res.status(409).json({
                    success: false,
                    message: "You already have a pending application to this club."
                });
            }

            return res.status(409).json({
                success: false,
                message: "This transaction ID has already been used. Please check it and try again."
            });
        }

        console.error("[Apply To Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not send your application right now. Please try again."
        });

    } finally {
        client.release();
    }
});

/**
 * GET /api/applications/mine
 * The student's own applications, newest first, with the payment status and the
 * leader's decision reason, so they can track every one of them.
 */
router.get("/applications/mine", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `SELECT a.id, a.club_id, c.name AS club_name, c.logo_url AS club_logo_url,
                    a.status, a.motivation, a.created_at, a.decided_at, a.decision_comment,
                    p.method AS payment_method, p.amount AS payment_amount,
                    p.status AS payment_status, p.transaction_id
             FROM membership_applications a
             JOIN clubs c ON c.id = a.club_id
             LEFT JOIN payments p ON p.membership_application_id = a.id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC`,
            [req.user!.id]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} application(s) found`,
            applications: result.rows
        });

    } catch (error) {
        console.error("[My Applications Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load your applications. Please try again."
        });
    }
});

/**
 * GET /api/clubs/:id/applications?status=pending|approved|rejected|cancelled|all
 * The club leader's review queue. Defaults to pending.
 */
router.get("/clubs/:id/applications", authenticate, requireClubPresident, async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);
        const status = cleanText(req.query.status) || "pending";
        const allowed = ["pending", "approved", "rejected", "cancelled", "all"];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: pending, approved, rejected, cancelled, all"
            });
        }

        const result = await pool.query(
            `SELECT a.id, a.status, a.motivation, a.experience, a.phone, a.created_at,
                    a.decided_at, a.decision_comment,
                    u.id AS applicant_id, u.name AS applicant_name, u.email AS applicant_email,
                    p.method AS payment_method, p.amount AS payment_amount,
                    p.status AS payment_status, p.transaction_id
             FROM membership_applications a
             JOIN users u ON u.id = a.user_id
             LEFT JOIN payments p ON p.membership_application_id = a.id
             WHERE a.club_id = $1 AND ($2::text = 'all' OR a.status = $2::text)
             ORDER BY a.created_at ASC`,
            [clubId, status]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} ${status} application(s) found`,
            applications: result.rows
        });

    } catch (error) {
        console.error("[Club Applications Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load the applications. Please try again."
        });
    }
});

/**
 * POST /api/clubs/:id/applications/:applicationId/approve
 * pending -> approved. For a paid application the president must confirm they
 * verified the payment (body: { "payment_verified": true }). Then, all together:
 * the application is approved, the payment becomes "success" and the student
 * becomes a member.
 */
router.post(
    "/clubs/:id/applications/:applicationId/approve",
    authenticate,
    requireClubPresident,
    async (req: Request, res: Response): Promise<any> => {
        const client = await pool.connect();

        try {
            const clubId = Number(req.params.id);
            const applicationId = Number(req.params.applicationId);
            const presidentId = req.user!.id;
            const comment = cleanText(req.body?.comment);

            if (!Number.isInteger(applicationId)) {
                return res.status(400).json({ success: false, message: "Invalid application id" });
            }

            // Does this application carry a payment the leader must confirm?
            const paymentResult = await pool.query(
                `SELECT p.method FROM payments p
                 JOIN membership_applications a ON a.id = p.membership_application_id
                 WHERE a.id = $1 AND a.club_id = $2`,
                [applicationId, clubId]
            );

            if (paymentResult.rows.length > 0 && req.body?.payment_verified !== true) {
                return res.status(400).json({
                    success: false,
                    message: "Confirm that you have verified the payment (bKash transaction checked, or cash received) before approving."
                });
            }

            await client.query("BEGIN");

            const applicationResult = await client.query(
                `UPDATE membership_applications
                 SET status = 'approved', decided_by = $1, decided_at = NOW(), decision_comment = $2
                 WHERE id = $3 AND club_id = $4 AND status = 'pending'
                 RETURNING user_id`,
                [presidentId, comment, applicationId, clubId]
            );

            if (applicationResult.rows.length === 0) {
                await client.query("ROLLBACK");

                const exists = await pool.query(
                    "SELECT status FROM membership_applications WHERE id = $1 AND club_id = $2",
                    [applicationId, clubId]
                );

                if (exists.rows.length === 0) {
                    return res.status(404).json({ success: false, message: "Application not found" });
                }

                return res.status(409).json({
                    success: false,
                    message: `This application is already "${exists.rows[0].status}" and cannot be approved.`
                });
            }

            const applicantId = applicationResult.rows[0].user_id;

            await markPaymentSuccess(client, applicationId, presidentId);

            // Create the membership, or reactivate it if this student left earlier
            await client.query(
                `INSERT INTO club_members (club_id, user_id)
                 VALUES ($1, $2)
                 ON CONFLICT (club_id, user_id)
                 DO UPDATE SET joined_at = NOW(), left_at = NULL`,
                [clubId, applicantId]
            );

            await client.query("COMMIT");

            return res.json({
                success: true,
                message: "Application approved. The student is now a member of your club."
            });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("[Approve Application Error]", error);
            return res.status(500).json({
                success: false,
                message: "Could not approve this application. Please try again."
            });

        } finally {
            client.release();
        }
    }
);

/**
 * POST /api/clubs/:id/applications/:applicationId/reject
 * pending -> rejected. A reason is required, because the student reads it.
 * A payment still waiting for confirmation is marked failed.
 */
router.post(
    "/clubs/:id/applications/:applicationId/reject",
    authenticate,
    requireClubPresident,
    async (req: Request, res: Response): Promise<any> => {
        const client = await pool.connect();

        try {
            const clubId = Number(req.params.id);
            const applicationId = Number(req.params.applicationId);
            const presidentId = req.user!.id;
            const comment = cleanText(req.body?.comment);

            if (!Number.isInteger(applicationId)) {
                return res.status(400).json({ success: false, message: "Invalid application id" });
            }

            if (!comment) {
                return res.status(400).json({ success: false, message: "A rejection reason is required" });
            }

            await client.query("BEGIN");

            const applicationResult = await client.query(
                `UPDATE membership_applications
                 SET status = 'rejected', decided_by = $1, decided_at = NOW(), decision_comment = $2
                 WHERE id = $3 AND club_id = $4 AND status = 'pending'
                 RETURNING id`,
                [presidentId, comment, applicationId, clubId]
            );

            if (applicationResult.rows.length === 0) {
                await client.query("ROLLBACK");

                const exists = await pool.query(
                    "SELECT status FROM membership_applications WHERE id = $1 AND club_id = $2",
                    [applicationId, clubId]
                );

                if (exists.rows.length === 0) {
                    return res.status(404).json({ success: false, message: "Application not found" });
                }

                return res.status(409).json({
                    success: false,
                    message: `This application is already "${exists.rows[0].status}" and cannot be rejected.`
                });
            }

            await markPaymentFailed(client, applicationId, presidentId);

            await client.query("COMMIT");

            return res.json({
                success: true,
                message: "Application rejected. The student can see your reason."
            });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("[Reject Application Error]", error);
            return res.status(500).json({
                success: false,
                message: "Could not reject this application. Please try again."
            });

        } finally {
            client.release();
        }
    }
);

/**
 * PATCH /api/clubs/:id/membership-settings
 * The president sets the club's membership fee and bKash number.
 * Body (both optional): { membership_fee: 200, bkash_number: "01712345678" }
 * Fee 0 = free. An empty bkash_number clears it (the club becomes cash only).
 * Existing applications keep the amount they were created with.
 */
router.patch("/clubs/:id/membership-settings", authenticate, requireClubPresident, async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);
        const body = req.body || {};

        const updates: string[] = [];
        const values: any[] = [];

        if (body.membership_fee !== undefined) {
            const fee = Number(body.membership_fee);

            if (!Number.isFinite(fee) || fee < 0 || fee > 100000) {
                return res.status(400).json({
                    success: false,
                    message: "The membership fee must be a number between 0 and 100000"
                });
            }

            values.push(Math.round(fee * 100) / 100);
            updates.push(`membership_fee = $${values.length}`);
        }

        if (body.bkash_number !== undefined) {
            const raw = cleanText(String(body.bkash_number));

            if (raw === null) {
                values.push(null);
            } else {
                const normalized = normalizeBdMobile(raw);

                if (!BD_MOBILE_REGEX.test(normalized)) {
                    return res.status(400).json({
                        success: false,
                        message: "Enter a valid bKash number, like 01712345678"
                    });
                }

                values.push(normalized);
            }

            updates.push(`bkash_number = $${values.length}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        values.push(clubId);

        const result = await pool.query(
            `UPDATE clubs SET ${updates.join(", ")}
             WHERE id = $${values.length}
             RETURNING id, name, membership_fee, bkash_number`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const club = result.rows[0];

        return res.json({
            success: true,
            message: "Membership settings saved.",
            club: { ...club, membership_fee: Number(club.membership_fee) }
        });

    } catch (error) {
        console.error("[Membership Settings Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not save the settings. Please try again."
        });
    }
});

export default router;