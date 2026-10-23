import "dotenv/config";
import multer from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Request, Response, NextFunction } from "express";

/**
 * POSTER STORAGE (Cloudinary)
 *
 * Same flow as logoStorage.ts, for event posters/banners:
 *   browser -> our backend (login + file checks) -> Cloudinary -> https URL
 * The URL is stored in events.image_url. Nothing is written to this server's disk.
 */

cloudinary.config({ secure: true }); // reads CLOUDINARY_URL from backend/.env

const MAX_POSTER_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const FOLDER = "club-hub/posters";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_POSTER_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
        cb(new Error("INVALID_POSTER_TYPE"));
    }
});

/**
 * Express middleware: reads ONE optional file from the form field "poster".
 * A request without a file (or a plain JSON request) passes straight through.
 * Always place it AFTER `authenticate` (and after the permission check on PATCH),
 * so a logged-out visitor can never push a file through it.
 */
export const posterUploadMiddleware = (req: Request, res: Response, next: NextFunction): any => {
    upload.single("poster")(req, res, (err: any) => {
        if (!err) return next();

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, message: "The poster must be 3 MB or smaller" });
        }

        if (err.message === "INVALID_POSTER_TYPE" || err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: "The poster must be a single PNG, JPG or WEBP image" });
        }

        console.error("[Poster Upload Error]", err);
        return res.status(500).json({ success: false, message: "Could not upload the poster. Please try again." });
    });
};

// A client can lie about the file type, so check the first bytes of the real file too.
const looksLikeAllowedImage = (head: Buffer): boolean => {
    const isPng = head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isWebp =
        head.subarray(0, 4).toString("ascii") === "RIFF" &&
        head.subarray(8, 12).toString("ascii") === "WEBP";
    return isPng || isJpg || isWebp;
};

/**
 * Checks the file's real content, uploads it to Cloudinary and returns the
 * secure https URL. Throws Error("INVALID_POSTER_CONTENT") for a fake image;
 * any other error means Cloudinary itself failed.
 */
export const savePoster = async (file: Express.Multer.File): Promise<string> => {
    if (!looksLikeAllowedImage(file.buffer.subarray(0, 12))) {
        throw new Error("INVALID_POSTER_CONTENT");
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: FOLDER,
                    resource_type: "image",
                    allowed_formats: ["png", "jpg", "webp"],
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                    // Banner-shaped images stay sharp, but nothing huge is stored.
                    transformation: [{ width: 1600, height: 900, crop: "limit" }]
                },
                (error, uploaded) => {
                    if (error || !uploaded) return reject(error || new Error("Cloudinary returned no result"));
                    resolve(uploaded);
                }
            )
            .end(file.buffer);
    });

    return result.secure_url;
};

/**
 * Deletes a stored poster (used when the database write fails after an upload,
 * or when a poster is replaced). Only touches files inside our own poster folder,
 * so an old pasted URL from another site is never "deleted".
 */
export const removePoster = async (posterUrl: string | null): Promise<void> => {
    if (!posterUrl || !posterUrl.includes("res.cloudinary.com")) return;

    const match = posterUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (!match || !match[1].startsWith(`${FOLDER}/`)) return;

    await cloudinary.uploader.destroy(match[1]).catch(() => {});
};