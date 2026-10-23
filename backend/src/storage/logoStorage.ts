import "dotenv/config";
import multer from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Request, Response, NextFunction } from "express";

/**
 * LOGO STORAGE (Cloudinary)
 *
 * The ONLY file that knows where logos live. Flow:
 *   browser -> our backend (login + file checks) -> Cloudinary -> https URL
 * The URL is what gets stored in clubs.logo_url. Uploading through the backend
 * (instead of straight from the browser) keeps the API secret off the frontend
 * and keeps our login and file checks in front of every upload.
 *
 * "dotenv/config" above makes sure CLOUDINARY_URL is loaded before the
 * Cloudinary library reads it.
 */

cloudinary.config({ secure: true }); // reads CLOUDINARY_URL from backend/.env

if (!process.env.CLOUDINARY_URL) {
    console.warn(
        "[Logo Storage] CLOUDINARY_URL is not set. Clubs can still be created without a logo, but logo uploads will fail."
    );
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const FOLDER = "club-hub/logos";

// Files are held in memory just long enough to forward them to Cloudinary.
// Nothing is ever written to this server's disk.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_LOGO_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
        cb(new Error("INVALID_LOGO_TYPE"));
    }
});

/**
 * Express middleware: reads ONE file from the form field named "logo".
 * Turns upload problems into clean 400 messages instead of crashes.
 */
export const logoUploadMiddleware = (req: Request, res: Response, next: NextFunction): any => {
    upload.single("logo")(req, res, (err: any) => {
        if (!err) return next();

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "The logo must be 2 MB or smaller"
            });
        }

        if (err.message === "INVALID_LOGO_TYPE" || err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: "The logo must be a single PNG, JPG or WEBP image"
            });
        }

        console.error("[Logo Upload Error]", err);
        return res.status(500).json({
            success: false,
            message: "Could not upload the logo. Please try again."
        });
    });
};

/**
 * The browser tells us the file type, but a client can lie about that. The first
 * bytes of a real PNG / JPEG / WEBP file are fixed, so check those too.
 */
const looksLikeAllowedImage = (head: Buffer): boolean => {
    const isPng = head
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isWebp =
        head.subarray(0, 4).toString("ascii") === "RIFF" &&
        head.subarray(8, 12).toString("ascii") === "WEBP";

    return isPng || isJpg || isWebp;
};

/** Nothing to clean up: with memory storage no temp file exists. Kept so the route code does not change. */
export const discardUpload = async (_file?: Express.Multer.File): Promise<void> => {};

/**
 * Checks the file's real content, uploads it to Cloudinary and returns the
 * secure https URL to store in clubs.logo_url.
 *
 * Throws Error("INVALID_LOGO_CONTENT") when the file is not a real image.
 * Any other error means Cloudinary itself failed (network, wrong credentials).
 */
export const saveLogo = async (file: Express.Multer.File): Promise<string> => {
    if (!looksLikeAllowedImage(file.buffer.subarray(0, 12))) {
        throw new Error("INVALID_LOGO_CONTENT");
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: FOLDER,
                    resource_type: "image",
                    allowed_formats: ["png", "jpg", "webp"],
                    // Cloudinary invents a random unique name, so one upload can
                    // never overwrite another and the client's file name is ignored.
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                    // Big enough to look sharp in the club card banner, still bounded.
                    transformation: [{ width: 1200, height: 1200, crop: "limit" }]
                },
                (error, uploaded) => {
                    if (error || !uploaded) {
                        return reject(error || new Error("Cloudinary returned no result"));
                    }
                    resolve(uploaded);
                }
            )
            .end(file.buffer);
    });

    return result.secure_url;
};

/**
 * Deletes a stored logo, used when the database write fails after the upload.
 * Only touches files inside our own club-hub/logos folder.
 */
export const removeLogo = async (logoUrl: string | null): Promise<void> => {
    if (!logoUrl || !logoUrl.includes("res.cloudinary.com")) return;

    const match = logoUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (!match || !match[1].startsWith(`${FOLDER}/`)) return;

    await cloudinary.uploader.destroy(match[1]).catch(() => {});
};