import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads", "objects");
const allowedMimeTypes = new Set(["image/jpeg", "image/png"]);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = file.mimetype === "image/png" ? ".png" : ".jpg";
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const multerUpload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }

    callback(null, true);
  },
}).array("fotos", 5);

export const uploadObjectPhotos = (req, res, next) => {
  multerUpload(req, res, (error) => {
    if (!error) return next();

    Promise.all(
      (req.files || []).map((file) => fs.promises.unlink(file.path).catch(() => undefined)),
    ).finally(() => {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Cada fotografía debe pesar como máximo 10 MB",
        });
      }

      if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          error: "Solo se permiten hasta 5 fotografías JPEG o PNG",
        });
      }

      next(error);
    });
  });
};

export { uploadDirectory };
