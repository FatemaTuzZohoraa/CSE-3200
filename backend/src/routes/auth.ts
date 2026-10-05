import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../db";

const router = express.Router();

// Strict regex for RUET EduMail: e.g. 2203032@student.ruet.ac.bd
const RUET_EDUMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.ruet\.ac\.bd$/i;

/**
 * Helper to configure Nodemailer transporter
 */
const getTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * True when real SMTP credentials are present.
 *
 * While developing on a laptop nobody has Gmail App Passwords wired up, and the
 * old behaviour left every new account stuck at is_verified = FALSE with no way
 * to unlock it, because the verification email could never arrive. When SMTP is
 * missing we skip the email and verify the account immediately, so the signup
 * and login pages can actually be tested end to end. Once EMAIL_USER and
 * EMAIL_PASSWORD are set, the normal verified-by-email flow is used again.
 */
const isSmtpConfigured = () =>
    Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

/**
 * POST /api/auth/register
 * Allows RUET students to sign up with name, EduMail, and password.
 * Always assigns role = 'student' and sends an email verification link.
 */
router.post("/register", async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password } = req.body;

        // 1. Basic field presence validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Validate RUET EduMail format
        if (!RUET_EDUMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Registration is restricted exclusively to valid RUET EduMail (@student.ruet.ac.bd)"
            });
        }

        // 3. Password length check
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // 4. Check for duplicate registrations
        const existingUserResult = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this EduMail is already registered"
            });
        }

        // 5. Secure password hashing with bcrypt
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 6. Generate secure verification token and expiry (24 hours)
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 7. Insert new user into database (Role forced to 'student')
        //    Without SMTP there is no email to verify, so the account is verified
        //    on the spot. See isSmtpConfigured above.
        const smtpReady = isSmtpConfigured();

        const insertQuery = `
            INSERT INTO users (
                name,
                email,
                password_hash,
                is_verified,
                verification_token,
                verification_expires,
                role
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, email, role, is_verified, created_at
        `;

        const newUserResult = await pool.query(insertQuery, [
            name.trim(),
            normalizedEmail,
            passwordHash,
            !smtpReady, // verified immediately only in the no-SMTP dev case
            smtpReady ? verificationToken : null,
            smtpReady ? verificationExpires : null,
            "student" // Enforce student role
        ]);

        const newUser = newUserResult.rows[0];

        // 8. Construct verification link and send email
        const baseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
        const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;

        if (smtpReady) {
            const transporter = getTransporter();

            const mailOptions = {
                from: `"RUET Club Zone" <${process.env.EMAIL_USER}>`,
                to: normalizedEmail,
                subject: "Verify Your RUET EduMail - RUET Club Management",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #db2777; text-align: center;">RUET Club Management</h2>
                        <p>Hello <strong>${newUser.name}</strong>,</p>
                        <p>Thank you for signing up. Please click the button below to verify your official RUET EduMail account and complete your registration:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Account</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #2563eb;"><a href="${verificationLink}">${verificationLink}</a></p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">This verification link will expire in 24 hours.</p>
                    </div>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (emailErr) {
                console.error("[Nodemailer Error] Failed to send verification email:", emailErr);
                // Notice: User account is created; let user know email dispatch had issue or advise checking inbox
            }
        } else {
            console.log(`[Register] SMTP not configured, so ${normalizedEmail} was auto-verified for local development.`);
        }

        return res.status(201).json({
            success: true,
            message: smtpReady
                ? "Registration successful. Please check your RUET EduMail to verify your account."
                : "Registration successful. Your account is ready, please log in.",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                is_verified: newUser.is_verified
            }
        });

    } catch (error) {
        console.error("[Registration Error]", error);
        return res.status(500).json({
            success: false,
            message: "Server error during registration. Please try again later."
        });
    }
});

/**
 * GET /api/auth/verify/:token
 * Verifies student email using the token sent in verification email.
 */
router.get("/verify/:token", async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #dc2626;">Invalid Request</h2>
                    <p>Verification token is missing.</p>
                </div>
            `);
        }

        // Query user with matching verification token
        const result = await pool.query(
            "SELECT id, name, email, verification_expires FROM users WHERE verification_token = $1",
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #dc2626;">Verification Failed</h2>
                    <p>Invalid or expired verification link.</p>
                </div>
            `);
        }

        const user = result.rows[0];

        // Check token expiration
        if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
            return res.status(400).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #dc2626;">Link Expired</h2>
                    <p>Your verification link has expired. Please request a new verification email from the login page.</p>
                </div>
            `);
        }

        // Mark user as verified and clear verification token
        await pool.query(
            `UPDATE users
             SET is_verified = TRUE,
                 verification_token = NULL,
                 verification_expires = NULL
             WHERE id = $1`,
            [user.id]
        );

        // Check if request expects JSON (e.g., API client) or HTML browser navigation
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.json({
                success: true,
                message: "Email verified successfully! You can now log in."
            });
        }

        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #16a34a;">Email Verified Successfully!</h2>
                <p>Hello <strong>${user.name}</strong>, your account is now active.</p>
                <p>You can close this window and proceed to log in to RUET Club Zone.</p>
            </div>
        `);

    } catch (error) {
        console.error("[Verification Error]", error);
        return res.status(500).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Server Error</h2>
                <p>An error occurred during verification. Please try again later.</p>
            </div>
        `);
    }
});

/**
 * POST /api/auth/resend-verification
 * Resends a verification email if account is not yet verified.
 */
router.post("/resend-verification", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const userResult = await pool.query(
            "SELECT id, name, is_verified FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No user found with this email"
            });
        }

        const user = userResult.rows[0];

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: "This account is already verified. You can log in directly."
            });
        }

        // Nothing can be sent without SMTP, so say so instead of throwing a
        // Nodemailer auth error at the user.
        if (!isSmtpConfigured()) {
            return res.status(503).json({
                success: false,
                message: "Email sending is not configured on this server yet. Please register again or contact the DSW office."
            });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
            `UPDATE users
             SET verification_token = $1,
                 verification_expires = $2
             WHERE id = $3`,
            [verificationToken, verificationExpires, user.id]
        );

        const baseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
        const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;

        const transporter = getTransporter();

        await transporter.sendMail({
            from: `"RUET Club Zone" <${process.env.EMAIL_USER}>`,
            to: normalizedEmail,
            subject: "Verify Your RUET EduMail - RUET Club Management",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #db2777; text-align: center;">RUET Club Management</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Here is your new account verification link:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Account</a>
                    </div>
                    <p><a href="${verificationLink}">${verificationLink}</a></p>
                </div>
            `
        });

        return res.json({
            success: true,
            message: "A new verification link has been sent to your RUET EduMail."
        });

    } catch (error) {
        console.error("[Resend Verification Error]", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resend verification email."
        });
    }
});

/**
 * POST /api/auth/login
 * Validates credentials, checks verification status, and generates JWT authentication token.
 */
router.post("/login", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        // 1. Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Fetch user from database
        const userResult = await pool.query(
            `SELECT id, name, email, password_hash, is_verified, role
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = userResult.rows[0];

        // 3. Verify password hash
        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Check if email is verified
        if (!user.is_verified) {
            return res.status(403).json({
                success: false,
                message: "Account not verified. Please check your RUET EduMail to verify your account before logging in."
            });
        }

        // 5. Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || "fallback_ruet_jwt_secret";
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(tokenPayload, jwtSecret, {
            expiresIn: "1h"
        });

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("[Login Error]", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login. Please try again later."
        });
    }
});

export default router;