import { Request, Response, NextFunction } from "express";
import pool from "../db";

/** Is this user the CURRENT president of this club? */
export const isPresidentOfClub = async (clubId: number, userId: number | string): Promise<boolean> => {
    const result = await pool.query(
        `SELECT 1 FROM club_leaderships
         WHERE club_id = $1 AND user_id = $2 AND ended_at IS NULL`,
        [clubId, userId]
    );
    return result.rows.length > 0;
};

/**
 * requireClubPresident (moved here from memberships.ts, same behaviour)
 * Only the CURRENT president of the club in :id may pass. Place AFTER `authenticate`.
 */
export const requireClubPresident = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const clubId = Number(req.params.id);

        if (!Number.isInteger(clubId)) {
            return res.status(400).json({ success: false, message: "Invalid club id" });
        }

        if (!(await isPresidentOfClub(clubId, req.user!.id))) {
            return res.status(403).json({
                success: false,
                message: "Only the president of this club can do this."
            });
        }

        next();
    } catch (error) {
        console.error("[Club President Check Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not verify your club role. Please try again."
        });
    }
};

/**
 * requireEventManager
 * :id is an EVENT id. Passes only if the user is the current president of ANY
 * club hosting that event. Today that is one club; with collaboration later,
 * every co-host's president can manage the event, with no code change.
 */
export const requireEventManager = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid event id" });
        }

        const exists = await pool.query("SELECT 1 FROM events WHERE id = $1", [eventId]);
        if (exists.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        const result = await pool.query(
            `SELECT 1
             FROM event_clubs ec
             JOIN club_leaderships l
               ON l.club_id = ec.club_id AND l.user_id = $2 AND l.ended_at IS NULL
             WHERE ec.event_id = $1`,
            [eventId, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Only the president of the hosting club can manage this event."
            });
        }

        next();
    } catch (error) {
        console.error("[Event Manager Check Error]", error);
        return res.status(500).json({
            success: false,
            message: "Could not verify your permission. Please try again."
        });
    }
};