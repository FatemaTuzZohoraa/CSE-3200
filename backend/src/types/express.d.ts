/**
 * TypeScript declaration that teaches Express about `req.user`.
 *
 * Our auth middleware puts the logged-in user here, so every route handler can
 * read `req.user.id` and `req.user.role` without any type errors.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                name: string;
                email: string;
                role: string;
            };
        }
    }
}

export {};