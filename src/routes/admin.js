import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { addForm, create } from "../controllers/admin.js";

const router = Router();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const uploadsDir = path.join(currentDirPath, "..", "..", "public", "video");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// const sanitizeFilename = (name) =>
//   name
//     .trim()
//     .replace(/\s+/g, "_")
//     .replace(/[^a-zA-Z0-9._-]/g, "");

const buildSafeFilename = (file) => {
  const fallbackName = "video";
  const rawOriginal = (file.originalname || "").trim() || `${fallbackName}.mp4`;
  const ext = path.extname(rawOriginal) || ".mp4";
  // const base = sanitizeFilename(path.basename(rawOriginal, ext)) || fallbackName;

  let candidate = `${fallbackName}${ext}`;
  let counter = 1;
  while (fs.existsSync(path.join(uploadsDir, candidate))) {
    candidate = `${fallbackName}-${counter}${ext}`;
    counter += 1;
  }
  return candidate;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, buildSafeFilename(file)),
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("video/")) {
      return cb(new Error("יש להעלות קובץ וידאו בלבד"));
    }
    cb(null, true);
  },
});

const singleVideoUpload = (req, res, next) => {
  upload.single("videoFile")(req, res, (err) => {
    if (err) {
      console.error("Video upload failed:", err);
      return res.redirect(
        "/admin/add?error=" +
          encodeURIComponent(err.message || "שגיאה בהעלאת קובץ הווידאו"),
      );
    }
    next();
  });
};

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  return res.status(403).render("errors/403");
}

router.get("/add", requireAdmin, addForm);
router.post("/add", requireAdmin, singleVideoUpload, create);

export default router;
