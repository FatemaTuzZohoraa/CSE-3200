import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Simple shape check for the advisor email. Only checked when the field is sent.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Turns any string field into either a clean trimmed string, or null when the
 * caller sent nothing useful. This is how we reject whitespace-only input.
 */
const cleanText = (value: any): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

/**
 * POST /api/clubs
 * Creates a club for the logged-in user.
 *
 * The request body only carries club details. The creator, the president and
 * the status are decided here on the server, never by the frontend.
 */
router.post("/", authenticate, async (req: Request, res: Response): Promise<any> => {
    const client = await pool.connect();

    try {
        const { name, description, category, logo_url, advisor_name, advisor_email, advisor_department } = req.body;

        // 1. Validation
        const errors: string[] = [];

        const clubName = cleanText(name);
        const clubDescription = cleanText(description);
        const clubCategory = cleanText(category);
        const advisorName = cleanText(advisor_name);
        const advisorEmail = cleanText(advisor_email);
        const advisorDepartment = cleanText(advisor_department);
        const logoUrl = cleanText(logo_url);

        if (!clubName) errors.push("Club name is required");
        if (!clubDescription) errors.push("Club description is required");
        if (!clubCategory) errors.push("Club category is required");
        if (!advisorName) errors.push("Advisor name is required");

        // advisor_email and logo_url are optional, but must look valid if present
        if (advisorEmail && !EMAIL_REGEX.test(advisorEmail)) {
            errors.push("Advisor email is not a valid email address");
        }

        if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
            errors.push("Logo URL must start with http:// or https://");
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors
            });
        }

        // 2. Open the transaction. Everything below either all lands, or none does.
        await client.query("BEGIN");

        // 3a. Create the club. status defaults to 'pending' in the database,
        //     and we never read status from the body.
        const clubResult = await client.query(
            `INSERT INTO clubs (name, description, category, logo_url,
                                advisor_name, advisor_email, advisor_department)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, description, category, logo_url, advisor_name,
                       advisor_email, advisor_department, status, created_at`,
            [clubName, clubDescription, clubCategory, logoUrl, advisorName, advisorEmail, advisorDepartment]
        );

        const club = clubResult.rows[0];
        const creatorId = req.user!.id;

        // 3b. The creator joins the club. club_leaderships has a foreign key to
        //     club_members, so this must happen first.
        await client.query(
            `INSERT INTO club_members (club_id, user_id)
             VALUES ($1, $2)`,
            [club.id, creatorId]
        );

        // 3c. The creator becomes the president. ended_at stays NULL, which is
        //     how the database marks the one current president per club.
        await client.query(
            `INSERT INTO club_leaderships (club_id, user_id)
             VALUES ($1, $2)`,
            [club.id, creatorId]
        );

        // 3d. Write the audit row. Old history is never edited, only appended.
        await client.query(
            `INSERT INTO club_status_history (club_id, acted_by, action, comment)
             VALUES ($1, $2, 'submitted', $3)`,
            [club.id, creatorId, `Submitted by ${req.user!.name} for DSW/Admin review`]
        );

        // 4. All four writes succeeded, so commit.
        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Your club has been submitted for admin/DSW review. It will appear in the public club list once approved.",
            club: {
                ...club,
                your_role: "president"
            }
        });

    } catch (error: any) {
        // Anything that failed above must not leave half a club behind.
        await client.query("ROLLBACK");

        // 23505 = unique_violation. clubs.name is UNIQUE, so this is a duplicate.
        if (error?.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A club with this name already exists. Please choose a different name."
            });
        }

        console.error("[Create Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not create the club right now. Please try again."
        });

    } finally {
        // Always give the connection back to the pool.
        client.release();
    }
});

/**
 * GET /api/clubs
 * Public listing. Shows approved clubs only.
 *
 * Note: this route is declared before /:id so "mine" is not read as an id.
 */
router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
        // Optional ?category= filter, and optional ?search= text match.
        const category = cleanText(req.query.category);
        const search = cleanText(req.query.search);

        const conditions: string[] = ["c.status = 'approved'"];
        const values: any[] = [];

        if (category) {
            values.push(category);
            conditions.push(`c.category = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`(c.name ILIKE $${values.length} OR c.description ILIKE $${values.length})`);
        }

        const result = await pool.query(
            `SELECT c.id, c.name, c.description, c.category, c.logo_url,
                    c.advisor_name, c.advisor_email, c.advisor_department, c.created_at,
                    (SELECT COUNT(*) FROM club_members m
                      WHERE m.club_id = c.id AND m.left_at IS NULL) AS members_count
             FROM clubs c
             WHERE ${conditions.join(" AND ")}
             ORDER BY c.created_at DESC`,
            values
        );

        return res.json({
            success: true,
            message: `${result.rows.length} approved club(s) found`,
            clubs: result.rows
        });

    } catch (error) {
        console.error("[List Clubs Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load clubs. Please try again."
        });
    }
});

/**
 * GET /api/clubs/mine
 * The logged-in user's own club submissions, newest first.
 *
 * "Submitted" means the user is the person who filled in the create-club form.
 * That is stored as the earliest 'submitted'/'resubmitted' row in
 * club_status_history, so it is read from there rather than guessed from
 * club_members (a member can also join an existing club and is not its creator).
 *
 * There is no user id in this URL on purpose. It always uses req.user.id, so a
 * student cannot read someone else's submissions by editing the request.
 */
router.get("/mine", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.description, c.category, c.logo_url, c.status, c.created_at,
                    (SELECT h.comment FROM club_status_history h
                      WHERE h.club_id = c.id AND h.action = 'rejected'
                      ORDER BY h.created_at DESC LIMIT 1) AS rejection_reason,
                    -- non-null only when this user is the club's current president
                    (SELECT l.user_id FROM club_leaderships l
                      WHERE l.club_id = c.id AND l.ended_at IS NULL) AS current_president_id
             FROM clubs c
             JOIN club_members m ON m.club_id = c.id AND m.user_id = $1
             WHERE EXISTS (
                 SELECT 1 FROM club_status_history h
                 WHERE h.club_id = c.id
                   AND h.acted_by = $1
                   AND h.action IN ('submitted', 'resubmitted')
             )
             ORDER BY c.created_at DESC`,
            [req.user!.id]
        );

        const currentUserId = req.user!.id;

        // Compare as numbers because BIGINT comes back from pg as a string.
        const clubs = result.rows.map((row: any) => ({
            ...row,
            is_president: row.current_president_id !== null && Number(row.current_president_id) === Number(currentUserId)
        }));

        return res.json({
            success: true,
            message: `${clubs.length} club submission(s) found`,
            clubs
        });

    } catch (error) {
        console.error("[My Clubs Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load your club submissions. Please try again."
        });
    }
});

/**
 * GET /api/clubs/joined
 * Approved clubs the logged-in user joined as a regular member.
 *
 * This is the mirror image of /mine: clubs the user submitted are excluded here
 * because those already have their own page. "is_member" lets the frontend show
 * a Leave button without a second round trip.
 */
router.get("/joined", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.description, c.category, c.logo_url,
                    c.advisor_name, c.advisor_department, c.status, m.joined_at,
                    TRUE AS is_member,
                    (SELECT COUNT(*) FROM club_members cm
                      WHERE cm.club_id = c.id AND cm.left_at IS NULL) AS members_count,
                    -- non-null only when this user is the club's current president
                    (SELECT l.user_id FROM club_leaderships l
                      WHERE l.club_id = c.id AND l.ended_at IS NULL) AS current_president_id
             FROM clubs c
             JOIN club_members m ON m.club_id = c.id AND m.user_id = $1 AND m.left_at IS NULL
             WHERE c.status = 'approved'
               AND NOT EXISTS (
                   SELECT 1 FROM club_status_history h
                   WHERE h.club_id = c.id
                     AND h.acted_by = $1
                     AND h.action IN ('submitted', 'resubmitted')
               )
             ORDER BY m.joined_at DESC`,
            [req.user!.id]
        );

        const currentUserId = req.user!.id;

        const clubs = result.rows.map((row: any) => ({
            ...row,
            is_president: row.current_president_id !== null && Number(row.current_president_id) === Number(currentUserId)
        }));

        return res.json({
            success: true,
            message: `${clubs.length} joined club(s) found`,
            clubs
        });

    } catch (error) {
        console.error("[Joined Clubs Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load your club memberships. Please try again."
        });
    }
});

/**
 * POST /api/clubs/:id/join
 * A signed-in student joins an approved club.
 *
 * Only the user id from the token is used, so nobody can join on someone else's
 * behalf. The club must be approved, otherwise a student could see a pending or
 * rejected club by guessing its id.
 */
router.post("/:id/join", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club id"
            });
        }

        const userId = req.user!.id;

        const clubResult = await pool.query(
            "SELECT id, name, status FROM clubs WHERE id = $1",
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        const club = clubResult.rows[0];

        if (club.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "This club is not open for joining right now. Only approved clubs accept new members."
            });
        }

        // The creator is already a member and president, so joining is a no-op.
        const leadershipResult = await pool.query(
            "SELECT 1 FROM club_leaderships WHERE club_id = $1 AND user_id = $2 AND ended_at IS NULL",
            [clubId, userId]
        );

        if (leadershipResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You are already a leader of "${club.name}".`
            });
        }

        // club_members has PRIMARY KEY (club_id, user_id), so a student who left
        // and comes back updates the same row instead of adding a second one.
        await pool.query(
            `INSERT INTO club_members (club_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (club_id, user_id)
             DO UPDATE SET joined_at = NOW(), left_at = NULL`,
            [clubId, userId]
        );

        const countResult = await pool.query(
            "SELECT COUNT(*) FROM club_members WHERE club_id = $1 AND left_at IS NULL",
            [clubId]
        );

        return res.status(201).json({
            success: true,
            message: `You have joined "${club.name}".`,
            club: {
                ...club,
                members_count: Number(countResult.rows[0].count),
                is_member: true
            }
        });

    } catch (error) {
        console.error("[Join Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not join this club right now. Please try again."
        });
    }
});

/**
 * POST /api/clubs/:id/leave
 * A member leaves a club. The row stays in club_members with left_at filled in,
 * which is how the schema models a past membership.
 */
router.post("/:id/leave", authenticate, async (req: Request, res: Response): Promise<any> => {
    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club id"
            });
        }

        const userId = req.user!.id;

        const clubResult = await pool.query(
            "SELECT id, name FROM clubs WHERE id = $1",
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        const club = clubResult.rows[0];

        // A president has to hand the role over first, otherwise the club would be
        // left with no current leader row.
        const leadershipResult = await pool.query(
            "SELECT 1 FROM club_leaderships WHERE club_id = $1 AND user_id = $2 AND ended_at IS NULL",
            [clubId, userId]
        );

        if (leadershipResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You are the current president of "${club.name}". Transfer the presidency before leaving.`
            });
        }

        const membershipResult = await pool.query(
            `UPDATE club_members
             SET left_at = NOW()
             WHERE club_id = $1 AND user_id = $2 AND left_at IS NULL`,
            [clubId, userId]
        );

        if (membershipResult.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: `You are not a member of "${club.name}".`
            });
        }

        return res.json({
            success: true,
            message: `You have left "${club.name}".`
        });

    } catch (error) {
        console.error("[Leave Club Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not leave this club right now. Please try again."
        });
    }
});

/**
 * GET /api/clubs/:id
 * Public details for one club. Only approved clubs are visible here.
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

        const result = await pool.query(
            `SELECT c.id, c.name, c.description, c.category, c.logo_url,
                    c.advisor_name, c.advisor_email, c.advisor_department, c.status, c.created_at,
                    (SELECT COUNT(*) FROM club_members m
                      WHERE m.club_id = c.id AND m.left_at IS NULL) AS members_count
             FROM clubs c
             WHERE c.id = $1 AND c.status = 'approved'`,
            [clubId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        return res.json({
            success: true,
            message: "Club found",
            club: result.rows[0]
        });

    } catch (error) {
        console.error("[Club Detail Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not load this club. Please try again."
        });
    }
});

export default router;