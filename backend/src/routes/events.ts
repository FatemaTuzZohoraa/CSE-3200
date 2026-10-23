import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/auth";
import { requireEventManager } from "../middleware/clubAuth";
import { posterUploadMiddleware, savePoster, removePoster } from "../storage/posterStorage";

const router = express.Router();

// ---------- small helpers ----------

const cleanText = (value: any): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

// Same rule as membership payments. Stored UPPERCASE so the UNIQUE column catches case variants.
const BKASH_TRX_REGEX = /^[A-Z0-9]{6,20}$/;
const AUDIENCES = ["members_only", "all_students"];

// new Date(null) is 1970, not "invalid", so only accept strings.
const parseDate = (value: any): Date | null => {
    if (typeof value !== "string") return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

// ---------- the one SELECT every event route shares ----------
// $1 is ALWAYS the logged-in user's id. It lets the database answer
// "is this user a member?" and "what is this user's registration?" per row.

const EVENT_COLUMNS = `
    e.id, e.title, e.description, e.image_url, e.venue,
    e.start_at, e.end_at, e.registration_deadline,
    e.capacity, e.fee::float8 AS fee, (e.fee > 0) AS is_paid,
    e.audience, e.status, e.created_at,
    (SELECT COUNT(*)::int FROM event_registrations r
      WHERE r.event_id = e.id
        AND r.status IN ('pending_payment', 'registered', 'attended')) AS registered_count,
    (SELECT json_build_object('id', c.id, 'name', c.name, 'logo_url', c.logo_url,
                              'bkash_number', CASE WHEN e.fee > 0 THEN c.bkash_number END)
       FROM event_clubs ec JOIN clubs c ON c.id = ec.club_id
      WHERE ec.event_id = e.id AND ec.is_primary) AS organizer,
    (SELECT COALESCE(json_agg(json_build_object(
                'id', c.id, 'name', c.name, 'logo_url', c.logo_url, 'is_primary', ec.is_primary)), '[]'::json)
       FROM event_clubs ec JOIN clubs c ON c.id = ec.club_id
      WHERE ec.event_id = e.id) AS clubs,
    (SELECT r.status FROM event_registrations r
      WHERE r.event_id = e.id AND r.user_id = $1) AS my_registration_status,
    EXISTS (SELECT 1 FROM event_clubs ec
              JOIN club_members m ON m.club_id = ec.club_id AND m.user_id = $1 AND m.left_at IS NULL
             WHERE ec.event_id = e.id) AS am_member,
    EXISTS (SELECT 1 FROM event_clubs ec
              JOIN club_leaderships l ON l.club_id = ec.club_id AND l.user_id = $1 AND l.ended_at IS NULL
             WHERE ec.event_id = e.id) AS am_host_president
`;

// Students see an event only if it is not cancelled AND its main club is still approved.
const VISIBLE = `
    e.status IN ('published', 'completed')
    AND EXISTS (SELECT 1 FROM event_clubs ec JOIN clubs c ON c.id = ec.club_id
                 WHERE ec.event_id = e.id AND ec.is_primary AND c.status = 'approved')
`;

// db can be the pool or a transaction client, so it is typed loosely on purpose.
const loadEvent = async (db: any, eventId: number, userId: any) => {
    const result = await db.query(
        `SELECT ${EVENT_COLUMNS} FROM events e WHERE e.id = $2 AND ${VISIBLE}`,
        [userId, eventId]
    );
    return result.rows[0] || null;
};

/**
 * checkEligibility: the SINGLE source of truth for "may this user register?".
 * The register route calls it for real; list/detail call it only so the
 * frontend can show a correct button and message. The frontend never decides.
 */
const checkEligibility = (e: any, isAdmin: boolean): { ok: boolean; http: number; reason: string | null } => {
    const no = (http: number, reason: string) => ({ ok: false, http, reason });

    if (isAdmin) return no(403, "Administrator accounts cannot register for events.");
    if (e.status !== "published") return no(409, "This event is not open for registration.");
    if (new Date() > new Date(e.registration_deadline)) return no(409, "The registration deadline has passed.");
    if (e.audience === "members_only" && !e.am_member) {
        return no(403, "This event is only for active members of the organizing club.");
    }
    if (e.my_registration_status && e.my_registration_status !== "cancelled") {
        return no(409, "You are already registered for this event.");
    }
    if (e.capacity !== null && e.registered_count >= e.capacity) {
        return no(409, "This event is full.");
    }
    return { ok: true, http: 200, reason: null };
};

const decorate = (row: any, isAdmin: boolean) => {
    const verdict = checkEligibility(row, isAdmin);
    return { ...row, can_register: verdict.ok, register_blocked_reason: verdict.reason };
};

/**
 * Validates the payment part of a registration. Returns errors + clean values.
 * A transaction ID is only the student's CLAIM. The president confirms it in their own bKash app.
 */
const parsePayment = (body: any, bkashNumber: string | null) => {
    const errors: string[] = [];
    const method = (cleanText(body?.payment_method) || "").toLowerCase();
    let transactionId: string | null = null;

    if (method !== "bkash" && method !== "cash") {
        errors.push("Choose a payment method: bKash or cash");
    } else if (method === "bkash") {
        transactionId = (cleanText(body?.transaction_id) || "").toUpperCase();
        if (!bkashNumber) {
            errors.push("This club does not accept bKash. Please choose cash.");
        } else if (!BKASH_TRX_REGEX.test(transactionId)) {
            errors.push("Enter the bKash transaction ID (letters and numbers only)");
        }
    }
    return { errors, method, transactionId };
};

const handleUniqueViolation = (error: any, res: Response): boolean => {
    if (error?.code !== "23505") return false;

    if (error.constraint === "payments_transaction_id_key") {
        res.status(409).json({
            success: false,
            message: "This transaction ID has already been used. Please check it and try again."
        });
    } else {
        // one_registration_per_student / one_open_payment_per_registration: a double click or race
        res.status(409).json({ success: false, message: "You are already registered for this event." });
    }
    return true;
};

/**
 * markEventPaymentSuccess
 * The ONE place an event payment becomes "success". The club president triggers
 * it today. A future bKash gateway webhook calls this same function with
 * verifiedBy = null, and nothing else in this file has to change.
 * It also moves the registration to "registered", because for events the
 * payment and the seat change together. Returns false if no payment was pending.
 */
const markEventPaymentSuccess = async (client: any, registrationId: number, verifiedBy: number | null): Promise<boolean> => {
    const paid = await client.query(
        `UPDATE payments
         SET status = 'success', verified_by = $2, verified_at = NOW(), paid_at = NOW()
         WHERE registration_id = $1 AND status = 'pending'
         RETURNING id`,
        [registrationId, verifiedBy]
    );

    if (paid.rows.length === 0) return false;

    await client.query("UPDATE event_registrations SET status = 'registered' WHERE id = $1", [registrationId]);
    return true;
};

// =====================================================================
// ROUTES. Order matters: fixed paths ("/managed", "/my/registrations")
// must come BEFORE "/:id", or Express reads "managed" as an id.
// =====================================================================

/**
 * POST /api/events: a club president creates an event for their approved club.
 *
 * The request is multipart/form-data: the text fields plus an OPTIONAL image in
 * the field "poster". A plain JSON request without a poster still works.
 * `authenticate` runs BEFORE the upload middleware, so a logged-out visitor can
 * never push a file through. The poster URL comes only from the uploaded file,
 * never from a text field, so nobody can store an arbitrary URL.
 */
router.post("/", authenticate, posterUploadMiddleware, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    // Declared out here so the catch block can delete the uploaded poster again
    // if the database write fails.
    let posterUrl: string | null = null;

    try {
        const body = req.body || {};
        const errors: string[] = [];

        const title = cleanText(body.title);
        const description = cleanText(body.description);
        const venue = cleanText(body.venue);
        const audience = cleanText(body.audience) || "all_students";
        const clubId = Number(body.club_id);

        if (!title) errors.push("Event title is required");
        else if (title.length > 150) errors.push("Title must be 150 characters or fewer");

        if (!venue) errors.push("Event venue is required");
        else if (venue.length > 200) errors.push("Venue must be 200 characters or fewer");

        if (description && description.length > 5000) errors.push("Description must be 5000 characters or fewer");

        if (!AUDIENCES.includes(audience)) errors.push("Audience must be members_only or all_students");
        if (!Number.isInteger(clubId)) errors.push("Choose the hosting club");

        const startAt = parseDate(body.start_at);
        const endAt = parseDate(body.end_at);
        const deadline = parseDate(body.registration_deadline);

        if (!startAt) errors.push("A valid start time is required");
        if (!endAt) errors.push("A valid end time is required");
        if (!deadline) errors.push("A valid registration deadline is required");

        if (startAt && endAt && deadline) {
            if (startAt.getTime() <= Date.now()) errors.push("Start time must be in the future");
            if (endAt <= startAt) errors.push("End time must be after the start time");
            if (deadline > startAt) errors.push("Registration deadline must be on or before the start time");
            if (deadline.getTime() <= Date.now()) errors.push("Registration deadline must be in the future");
        }

        let capacity: number | null = null;
        if (body.capacity !== undefined && body.capacity !== null && body.capacity !== "") {
            capacity = Number(body.capacity);
            if (!Number.isInteger(capacity) || capacity < 1) {
                errors.push("Capacity must be a whole number of 1 or more (or leave it empty for unlimited)");
            }
        }

        let fee = 0;
        if (body.fee !== undefined && body.fee !== null && body.fee !== "") {
            fee = Number(body.fee);
            if (!Number.isFinite(fee) || fee < 0 || fee > 100000) {
                errors.push("Fee must be a number between 0 and 100000 (0 = free)");
            }
            fee = Math.round(fee * 100) / 100;
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const userId = req.user!.id;

        // Must be the CURRENT president of this club, and the club must be approved.
        const leaderCheck = await pool.query(
            `SELECT c.id FROM clubs c
             JOIN club_leaderships l ON l.club_id = c.id AND l.user_id = $1 AND l.ended_at IS NULL
             WHERE c.id = $2 AND c.status = 'approved'`,
            [userId, clubId]
        );

        if (leaderCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You can only create events for an approved club where you are the current president."
            });
        }

        // Poster (optional). Uploaded only AFTER every check above has passed.
        if (req.file) {
            try {
                posterUrl = await savePoster(req.file);
            } catch (posterError: any) {
                if (posterError?.message === "INVALID_POSTER_CONTENT") {
                    return res.status(400).json({
                        success: false,
                        message: "The poster must be a real PNG, JPG or WEBP image"
                    });
                }

                // Not the user's fault: Cloudinary unreachable or credentials wrong
                console.error("[Poster Upload Error]", posterError);
                return res.status(502).json({
                    success: false,
                    message: "Could not upload the poster right now. Please try again, or create the event without one."
                });
            }
        }

        await client.query("BEGIN");

        const eventResult = await client.query(
            `INSERT INTO events (title, description, image_url, venue, start_at, end_at,
                                 registration_deadline, capacity, fee, audience, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`,
            [title, description, posterUrl, venue, startAt, endAt, deadline, capacity, fee, audience, userId]
        );

        const eventId = eventResult.rows[0].id;

        await client.query(
            `INSERT INTO event_clubs (event_id, club_id, is_primary) VALUES ($1, $2, TRUE)`,
            [eventId, clubId]
        );

        await client.query("COMMIT");

        // The event is saved. From here on the poster must NOT be deleted, even if reading it back fails.
        posterUrl = null;

        const created = await loadEvent(pool, eventId, userId);

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: created
        });

    } catch (error) {
        await client.query("ROLLBACK");
        await removePoster(posterUrl); // no orphan file left behind
        console.error("[Create Event Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not create the event right now. Please try again."
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/events?upcoming=true&club_id=3
 * Login required. Each event says whether THIS user can register, and why not.
 */
router.get("/", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const conditions: string[] = [VISIBLE];
        const values: any[] = [req.user!.id];

        if (req.query.upcoming === "true") {
            conditions.push("e.start_at > NOW()");
        }

        if (req.query.club_id !== undefined) {
            const clubId = Number(req.query.club_id);
            if (!Number.isInteger(clubId)) {
                return res.status(400).json({ success: false, message: "Invalid club id" });
            }
            values.push(clubId);
            conditions.push(
                `EXISTS (SELECT 1 FROM event_clubs ec WHERE ec.event_id = e.id AND ec.club_id = $${values.length})`
            );
        }

        const result = await pool.query(
            `SELECT ${EVENT_COLUMNS} FROM events e
             WHERE ${conditions.join(" AND ")}
             ORDER BY e.start_at ASC`,
            values
        );

        const isAdmin = req.user!.role === "admin";

        return res.json({
            success: true,
            message: `${result.rows.length} event(s) found`,
            events: result.rows.map((row: any) => decorate(row, isAdmin))
        });

    } catch (error) {
        console.error("[List Events Error]", error);
        return res.status(500).json({ success: false, message: "Could not load events. Please try again." });
    }
});

/** GET /api/events/managed: every event (any status) of the clubs I currently lead. */
router.get("/managed", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `SELECT ${EVENT_COLUMNS},
                    (SELECT COUNT(*)::int FROM payments p
                       JOIN event_registrations r ON r.id = p.registration_id
                      WHERE r.event_id = e.id AND p.status = 'pending') AS pending_payments
             FROM events e
             WHERE EXISTS (SELECT 1 FROM event_clubs ec
                             JOIN club_leaderships l ON l.club_id = ec.club_id
                              AND l.user_id = $1 AND l.ended_at IS NULL
                            WHERE ec.event_id = e.id)
             ORDER BY e.start_at DESC`,
            [req.user!.id]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} event(s) found`,
            events: result.rows
        });
    } catch (error) {
        console.error("[Managed Events Error]", error);
        return res.status(500).json({ success: false, message: "Could not load your events. Please try again." });
    }
});

/** GET /api/events/my/registrations: the student's own registrations with payment status. */
router.get("/my/registrations", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.status, r.registered_at,
                    e.id AS event_id, e.title, e.venue, e.start_at, e.status AS event_status,
                    e.fee::float8 AS fee, c.name AS club_name,
                    p.method AS payment_method, p.amount::float8 AS payment_amount,
                    p.status AS payment_status, p.transaction_id, p.review_note
             FROM event_registrations r
             JOIN events e ON e.id = r.event_id
             LEFT JOIN event_clubs ec ON ec.event_id = e.id AND ec.is_primary
             LEFT JOIN clubs c ON c.id = ec.club_id
             LEFT JOIN LATERAL (
                 SELECT * FROM payments WHERE registration_id = r.id
                 ORDER BY created_at DESC, id DESC LIMIT 1
             ) p ON TRUE
             WHERE r.user_id = $1
             ORDER BY e.start_at DESC`,
            [req.user!.id]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} registration(s) found`,
            registrations: result.rows
        });
    } catch (error) {
        console.error("[My Registrations Error]", error);
        return res.status(500).json({ success: false, message: "Could not load your registrations. Please try again." });
    }
});

/** GET /api/events/:id. Cancelled events and events of unapproved clubs return 404. */
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const eventId = Number(req.params.id);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid event id" });
        }

        const event = await loadEvent(pool, eventId, req.user!.id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        return res.json({
            success: true,
            message: "Event found",
            event: decorate(event, req.user!.role === "admin")
        });
    } catch (error) {
        console.error("[Event Detail Error]", error);
        return res.status(500).json({ success: false, message: "Could not load this event. Please try again." });
    }
});

/**
 * POST /api/events/:id/register
 * Body (only for paid events): payment_method "bkash" | "cash", transaction_id (bkash only)
 *
 * Everything runs inside ONE transaction that first LOCKS the event row, so two
 * students cannot both take the last seat. Every rule is checked here.
 */
router.post("/:id/register", authenticate, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const eventId = Number(req.params.id);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid event id" });
        }

        const userId = req.user!.id;
        const isAdmin = req.user!.role === "admin";

        await client.query("BEGIN");

        // Lock this event for the rest of the transaction.
        const locked = await client.query("SELECT id FROM events WHERE id = $1 FOR UPDATE", [eventId]);
        const event = locked.rows.length ? await loadEvent(client, eventId, userId) : null;

        if (!event) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Rules: admin, status, deadline, audience, duplicate, capacity
        const verdict = checkEligibility(event, isAdmin);
        if (!verdict.ok) {
            await client.query("ROLLBACK");
            return res.status(verdict.http).json({ success: false, message: verdict.reason });
        }

        const fee = Number(event.fee);
        let method: string | null = null;
        let transactionId: string | null = null;

        if (fee > 0) {
            const parsed = parsePayment(req.body, event.organizer?.bkash_number ?? null);
            if (parsed.errors.length > 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({ success: false, message: parsed.errors[0], errors: parsed.errors });
            }
            method = parsed.method;
            transactionId = parsed.transactionId;
        }

        const newStatus = fee > 0 ? "pending_payment" : "registered";

        // A cancelled registration is re-activated (the UNIQUE (event, user) rule allows only one row).
        const existing = await client.query(
            "SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2 FOR UPDATE",
            [eventId, userId]
        );

        let registrationId: any;

        if (existing.rows.length > 0) {
            registrationId = existing.rows[0].id;
            await client.query(
                "UPDATE event_registrations SET status = $1, registered_at = NOW() WHERE id = $2",
                [newStatus, registrationId]
            );
        } else {
            const inserted = await client.query(
                `INSERT INTO event_registrations (event_id, user_id, status)
                 VALUES ($1, $2, $3) RETURNING id`,
                [eventId, userId, newStatus]
            );
            registrationId = inserted.rows[0].id;
        }

        // The fee is COPIED into the payment now, so later fee edits never change it.
        if (fee > 0) {
            await client.query(
                `INSERT INTO payments (registration_id, amount, method, transaction_id)
                 VALUES ($1, $2, $3, $4)`,
                [registrationId, fee, method, transactionId]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: fee > 0
                ? "Registration received. The club president will verify your payment to confirm your seat."
                : "You are registered for this event.",
            registration: { id: registrationId, status: newStatus, amount: fee, payment_method: method }
        });

    } catch (error: any) {
        await client.query("ROLLBACK");
        if (handleUniqueViolation(error, res)) return;

        console.error("[Register Event Error]", error);
        return res.status(500).json({ success: false, message: "Could not complete your registration. Please try again." });
    } finally {
        client.release();
    }
});

/**
 * POST /api/events/:id/payment
 * Resubmit payment details after the president rejected the previous attempt.
 */
router.post("/:id/payment", authenticate, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const eventId = Number(req.params.id);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid event id" });
        }

        const userId = req.user!.id;

        await client.query("BEGIN");

        const regResult = await client.query(
            `SELECT r.id, r.status FROM event_registrations r
             WHERE r.event_id = $1 AND r.user_id = $2 FOR UPDATE`,
            [eventId, userId]
        );

        if (regResult.rows.length === 0 || regResult.rows[0].status !== "pending_payment") {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "You have no registration waiting for payment." });
        }

        const registration = regResult.rows[0];

        const event = await loadEvent(client, eventId, userId);
        if (!event || event.status !== "published" || new Date(event.start_at) <= new Date()) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "This event is no longer accepting payments." });
        }

        const open = await client.query(
            "SELECT 1 FROM payments WHERE registration_id = $1 AND status = 'pending'",
            [registration.id]
        );
        if (open.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Your payment is already waiting for verification." });
        }

        const parsed = parsePayment(req.body, event.organizer?.bkash_number ?? null);
        if (parsed.errors.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: parsed.errors[0], errors: parsed.errors });
        }

        await client.query(
            `INSERT INTO payments (registration_id, amount, method, transaction_id)
             VALUES ($1, $2, $3, $4)`,
            [registration.id, event.fee, parsed.method, parsed.transactionId]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Payment details sent. The club president will verify them."
        });

    } catch (error: any) {
        await client.query("ROLLBACK");
        if (handleUniqueViolation(error, res)) return;

        console.error("[Resubmit Payment Error]", error);
        return res.status(500).json({ success: false, message: "Could not send your payment details. Please try again." });
    } finally {
        client.release();
    }
});

/**
 * POST /api/events/:id/cancel-registration
 * A student cancels. Not allowed once the president confirmed a payment
 * (refunds are handled by the club) or after the event started.
 */
router.post("/:id/cancel-registration", authenticate, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const eventId = Number(req.params.id);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid event id" });
        }

        await client.query("BEGIN");

        const result = await client.query(
            `SELECT r.id, r.status, e.start_at,
                    EXISTS (SELECT 1 FROM payments p WHERE p.registration_id = r.id AND p.status = 'success') AS paid
             FROM event_registrations r JOIN events e ON e.id = r.event_id
             WHERE r.event_id = $1 AND r.user_id = $2 FOR UPDATE OF r`,
            [eventId, req.user!.id]
        );

        const reg = result.rows[0];

        const refuse = async (http: number, message: string) => {
            await client.query("ROLLBACK");
            return res.status(http).json({ success: false, message });
        };

        if (!reg) return refuse(404, "You are not registered for this event.");
        if (reg.status === "cancelled") return refuse(409, "This registration is already cancelled.");
        if (reg.status === "attended") return refuse(409, "You already attended this event.");
        if (new Date(reg.start_at) <= new Date()) return refuse(409, "This event has already started.");
        if (reg.paid) {
            return refuse(409, "Your payment was already confirmed. Please contact the club about a refund.");
        }

        await client.query(
            `UPDATE payments SET status = 'failed', review_note = 'Cancelled by the student'
             WHERE registration_id = $1 AND status = 'pending'`,
            [reg.id]
        );
        await client.query("UPDATE event_registrations SET status = 'cancelled' WHERE id = $1", [reg.id]);

        await client.query("COMMIT");

        return res.json({ success: true, message: "Your registration was cancelled." });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[Cancel Registration Error]", error);
        return res.status(500).json({ success: false, message: "Could not cancel your registration. Please try again." });
    } finally {
        client.release();
    }
});

// ---------------- Club president routes (requireEventManager) ----------------

/**
 * PATCH /api/events/:id: edit a published event.
 *
 * multipart/form-data. Only the fields that are sent are changed. Poster:
 *   - a file in the field "poster" replaces the current poster
 *   - remove_poster = "true" (and no file) deletes it
 * Order matters: authenticate -> requireEventManager -> upload, so only the
 * hosting club's president can push a file through.
 */
router.patch("/:id", authenticate, requireEventManager, posterUploadMiddleware, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    // The newly uploaded poster, so the catch block can delete it if the update fails.
    let newPosterUrl: string | null = null;

    try {
        const eventId = Number(req.params.id);
        const body = req.body || {};

        await client.query("BEGIN");

        // Same lock as registration, so nobody registers while the rules are changing.
        const current = await client.query("SELECT * FROM events WHERE id = $1 FOR UPDATE", [eventId]);
        const ev = current.rows[0];

        const refuse = async (http: number, message: string, errors?: string[]) => {
            await client.query("ROLLBACK");
            return res.status(http).json({ success: false, message, ...(errors ? { errors } : {}) });
        };

        if (ev.status !== "published") return refuse(409, `A ${ev.status} event cannot be edited.`);

        const errors: string[] = [];

        // Start from the stored values, then apply only the fields that were sent.
        let title = ev.title, description = ev.description, imageUrl = ev.image_url, venue = ev.venue;
        let startAt: Date = ev.start_at, endAt: Date = ev.end_at, deadline: Date = ev.registration_deadline;
        let capacity: number | null = ev.capacity, fee = Number(ev.fee), audience = ev.audience;

        if (body.title !== undefined) {
            title = cleanText(body.title);
            if (!title) errors.push("Event title is required");
            else if (title.length > 150) errors.push("Title must be 150 characters or fewer");
        }
        if (body.venue !== undefined) {
            venue = cleanText(body.venue);
            if (!venue) errors.push("Event venue is required");
            else if (venue.length > 200) errors.push("Venue must be 200 characters or fewer");
        }
        if (body.description !== undefined) {
            description = cleanText(body.description);
            if (description && description.length > 5000) errors.push("Description must be 5000 characters or fewer");
        }
        if (body.remove_poster === "true") {
            imageUrl = null;
        }
        if (body.audience !== undefined) {
            audience = cleanText(body.audience);
            if (!audience || !AUDIENCES.includes(audience)) errors.push("Audience must be members_only or all_students");
        }

        const startChanged = body.start_at !== undefined;
        if (startChanged) {
            const d = parseDate(body.start_at);
            if (!d) errors.push("A valid start time is required"); else startAt = d;
        }
        if (body.end_at !== undefined) {
            const d = parseDate(body.end_at);
            if (!d) errors.push("A valid end time is required"); else endAt = d;
        }
        if (body.registration_deadline !== undefined) {
            const d = parseDate(body.registration_deadline);
            if (!d) errors.push("A valid registration deadline is required"); else deadline = d;
        }
        if (body.capacity !== undefined) {
            if (body.capacity === null || body.capacity === "") capacity = null;
            else {
                capacity = Number(body.capacity);
                if (!Number.isInteger(capacity) || capacity < 1) errors.push("Capacity must be a whole number of 1 or more, or empty for unlimited");
            }
        }
        if (body.fee !== undefined) {
            fee = Number(body.fee);
            if (!Number.isFinite(fee) || fee < 0 || fee > 100000) errors.push("Fee must be a number between 0 and 100000 (0 = free)");
            fee = Math.round(fee * 100) / 100;
        }

        if (errors.length === 0) {
            if (new Date(endAt) <= new Date(startAt)) errors.push("End time must be after the start time");
            if (new Date(deadline) > new Date(startAt)) errors.push("Registration deadline must be on or before the start time");
            if (startChanged && new Date(startAt).getTime() <= Date.now()) errors.push("Start time must be in the future");
        }

        if (errors.length > 0) return refuse(400, errors[0], errors);

        // Rules that depend on who has already registered
        const counted = await client.query(
            `SELECT COUNT(*)::int AS n FROM event_registrations WHERE event_id = $1 AND status <> 'cancelled'`,
            [eventId]
        );
        const activeRegistrations = counted.rows[0].n;

        if (activeRegistrations > 0 && fee !== Number(ev.fee)) {
            return refuse(409, "The fee cannot be changed after students have registered.");
        }
        if (activeRegistrations > 0 && audience !== ev.audience) {
            return refuse(409, "The audience cannot be changed after students have registered.");
        }
        if (capacity !== null && capacity < activeRegistrations) {
            return refuse(409, `Capacity cannot be lower than the ${activeRegistrations} students already registered.`);
        }

        // New poster: uploaded only AFTER every rule above has passed. A file wins over remove_poster.
        if (req.file) {
            try {
                newPosterUrl = await savePoster(req.file);
                imageUrl = newPosterUrl;
            } catch (posterError: any) {
                if (posterError?.message === "INVALID_POSTER_CONTENT") {
                    return refuse(400, "The poster must be a real PNG, JPG or WEBP image");
                }
                console.error("[Poster Upload Error]", posterError);
                return refuse(502, "Could not upload the poster right now. Please try again.");
            }
        }

        await client.query(
            `UPDATE events
             SET title = $1, description = $2, image_url = $3, venue = $4, start_at = $5, end_at = $6,
                 registration_deadline = $7, capacity = $8, fee = $9, audience = $10
             WHERE id = $11`,
            [title, description, imageUrl, venue, startAt, endAt, deadline, capacity, fee, audience, eventId]
        );

        await client.query("COMMIT");

        // Saved. Delete the poster that was replaced or removed, and make sure the
        // catch block below can never delete the new one.
        if (ev.image_url && ev.image_url !== imageUrl) await removePoster(ev.image_url);
        newPosterUrl = null;

        const updated = await loadEvent(pool, eventId, req.user!.id);

        return res.json({ success: true, message: "Event updated.", event: updated });

    } catch (error) {
        await client.query("ROLLBACK");
        await removePoster(newPosterUrl); // the update failed, so drop the freshly uploaded file
        console.error("[Update Event Error]", error);
        return res.status(500).json({ success: false, message: "Could not update the event. Please try again." });
    } finally {
        client.release();
    }
});

/** POST /api/events/:id/cancel: cancel the whole event. */
router.post("/:id/cancel", authenticate, requireEventManager, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `UPDATE events SET status = 'cancelled' WHERE id = $1 AND status = 'published' RETURNING id`,
            [Number(req.params.id)]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ success: false, message: "Only a published event can be cancelled." });
        }

        return res.json({
            success: true,
            message: "Event cancelled. Refund any confirmed payments to students yourselves."
        });
    } catch (error) {
        console.error("[Cancel Event Error]", error);
        return res.status(500).json({ success: false, message: "Could not cancel the event. Please try again." });
    }
});

/** GET /api/events/:id/registrations?status=all|pending_payment|registered|cancelled|attended */
router.get("/:id/registrations", authenticate, requireEventManager, async (req: Request, res: Response): Promise<any> => {
    try {
        const status = cleanText(req.query.status) || "all";
        const allowed = ["all", "pending_payment", "registered", "cancelled", "attended"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(", ")}` });
        }

        const result = await pool.query(
            `SELECT r.id, r.status, r.registered_at,
                    u.id AS user_id, u.name, u.email,
                    p.method AS payment_method, p.amount::float8 AS payment_amount,
                    p.status AS payment_status, p.transaction_id, p.review_note
             FROM event_registrations r
             JOIN users u ON u.id = r.user_id
             LEFT JOIN LATERAL (
                 SELECT * FROM payments WHERE registration_id = r.id
                 ORDER BY created_at DESC, id DESC LIMIT 1
             ) p ON TRUE
             WHERE r.event_id = $1 AND ($2::text = 'all' OR r.status = $2::text)
             ORDER BY r.registered_at ASC`,
            [Number(req.params.id), status]
        );

        return res.json({
            success: true,
            message: `${result.rows.length} registration(s) found`,
            registrations: result.rows
        });
    } catch (error) {
        console.error("[Event Registrations Error]", error);
        return res.status(500).json({ success: false, message: "Could not load the registrations. Please try again." });
    }
});

/**
 * POST /api/events/:id/registrations/:regId/approve-payment
 * Body: { payment_verified: true }. The president confirms they checked the
 * bKash transaction in their own app, or received the cash.
 */
router.post(
    "/:id/registrations/:regId/approve-payment",
    authenticate,
    requireEventManager,
    async (req: Request, res: Response): Promise<any> => {
        const client = await pool.connect();

        try {
            const eventId = Number(req.params.id);
            const regId = Number(req.params.regId);

            if (!Number.isInteger(regId)) {
                return res.status(400).json({ success: false, message: "Invalid registration id" });
            }
            if (req.body?.payment_verified !== true) {
                return res.status(400).json({
                    success: false,
                    message: "Confirm that you verified the payment (bKash transaction checked, or cash received) first."
                });
            }

            await client.query("BEGIN");

            const reg = await client.query(
                `SELECT status FROM event_registrations WHERE id = $1 AND event_id = $2 FOR UPDATE`,
                [regId, eventId]
            );

            if (reg.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ success: false, message: "Registration not found" });
            }
            if (reg.rows[0].status !== "pending_payment") {
                await client.query("ROLLBACK");
                return res.status(409).json({ success: false, message: `This registration is already "${reg.rows[0].status}".` });
            }

            const confirmed = await markEventPaymentSuccess(client, regId, req.user!.id);

            if (!confirmed) {
                await client.query("ROLLBACK");
                return res.status(409).json({ success: false, message: "There is no pending payment to verify." });
            }

            await client.query("COMMIT");

            return res.json({ success: true, message: "Payment confirmed. The student is registered." });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("[Approve Event Payment Error]", error);
            return res.status(500).json({ success: false, message: "Could not confirm this payment. Please try again." });
        } finally {
            client.release();
        }
    }
);

/** POST /api/events/:id/registrations/:regId/reject-payment. Body: { comment } (required). */
router.post(
    "/:id/registrations/:regId/reject-payment",
    authenticate,
    requireEventManager,
    async (req: Request, res: Response): Promise<any> => {
        const client = await pool.connect();

        try {
            const eventId = Number(req.params.id);
            const regId = Number(req.params.regId);
            const comment = cleanText(req.body?.comment);

            if (!Number.isInteger(regId)) {
                return res.status(400).json({ success: false, message: "Invalid registration id" });
            }
            if (!comment) {
                return res.status(400).json({ success: false, message: "A rejection reason is required" });
            }

            await client.query("BEGIN");

            const reg = await client.query(
                `SELECT status FROM event_registrations WHERE id = $1 AND event_id = $2 FOR UPDATE`,
                [regId, eventId]
            );

            if (reg.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ success: false, message: "Registration not found" });
            }
            if (reg.rows[0].status !== "pending_payment") {
                await client.query("ROLLBACK");
                return res.status(409).json({ success: false, message: `This registration is already "${reg.rows[0].status}".` });
            }

            const failed = await client.query(
                `UPDATE payments
                 SET status = 'failed', verified_by = $1, verified_at = NOW(), review_note = $2
                 WHERE registration_id = $3 AND status = 'pending'
                 RETURNING id`,
                [req.user!.id, comment, regId]
            );

            if (failed.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(409).json({ success: false, message: "There is no pending payment to reject." });
            }

            // The registration stays pending_payment, so the student can resubmit.
            await client.query("COMMIT");

            return res.json({ success: true, message: "Payment rejected. The student can see your reason and try again." });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("[Reject Event Payment Error]", error);
            return res.status(500).json({ success: false, message: "Could not reject this payment. Please try again." });
        } finally {
            client.release();
        }
    }
);

export default router;