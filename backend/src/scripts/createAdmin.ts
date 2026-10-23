import bcrypt from "bcryptjs";
import pool from "../db";

/**
 * Controlled setup for the platform admin (the DSW account).
 *
 * Usage, from backend/:
 *   npx ts-node src/scripts/createAdmin.ts "<Name>" <email> '<password>'
 *
 * Rules, so this script can never quietly hand out admin powers:
 *   1. The email already belongs to an ADMIN -> only that admin's password is reset.
 *   2. The email does not exist AND no admin exists at all -> the first admin is created.
 *   3. Anything else (the email is a student, or another admin already exists)
 *      -> refuse and change nothing.
 * Promoting an existing student is a deliberate manual SQL step, never this script.
 */
const [name, rawEmail, password] = process.argv.slice(2);

if (!name || !rawEmail || !password) {
    console.log("Usage: npx ts-node src/scripts/createAdmin.ts \"Name\" email 'password'");
    process.exit(1);
}

if (password.length < 8) {
    console.error("Refused: the admin password must be at least 8 characters.");
    process.exit(1);
}

const email = rawEmail.toLowerCase().trim();

(async () => {
    try {
        const existing = await pool.query(
            "SELECT id, role FROM users WHERE email = $1",
            [email]
        );

        const passwordHash = await bcrypt.hash(password, 10);

        // Rule 1: existing admin -> password reset only
        if (existing.rows.length > 0) {
            if (existing.rows[0].role !== "admin") {
                console.error(`Refused: ${email} is a "${existing.rows[0].role}" account. This script never promotes existing accounts.`);
                process.exitCode = 1;
                return;
            }

            await pool.query(
                "UPDATE users SET password_hash = $1, is_verified = TRUE WHERE id = $2",
                [passwordHash, existing.rows[0].id]
            );

            console.log(`Password reset for existing admin ${email} (id ${existing.rows[0].id}).`);
            return;
        }

        // Rule 3: another admin exists, so this would be a second admin
        const admins = await pool.query("SELECT email FROM users WHERE role = 'admin'");

        if (admins.rows.length > 0) {
            const list = admins.rows.map((r) => r.email).join(", ");
            console.error(`Refused: an admin already exists (${list}). Only one admin is allowed for now.`);
            process.exitCode = 1;
            return;
        }

        // Rule 2: no admin anywhere -> create the first one
        const created = await pool.query(
            `INSERT INTO users (name, email, password_hash, is_verified, role)
             VALUES ($1, $2, $3, TRUE, 'admin')
             RETURNING id, email, role`,
            [name.trim(), email, passwordHash]
        );

        console.log("First admin created:", created.rows[0]);

    } catch (err) {
        console.error("Could not set up the admin:", err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();