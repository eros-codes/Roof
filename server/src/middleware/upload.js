import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRODUCTS_DIR = path.join(
  __dirname,
  "..", "..", "..",
  "public", "assets", "images", "products"
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCTS_DIR),
  filename: (_req, file, cb) => {
    const EXT_MAP = {
      "image/jpeg": ".jpg",
      "image/png":  ".png",
      "image/webp": ".webp",
      "image/gif":  ".gif",
    };
    const ext = EXT_MAP[file.mimetype] || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `temp-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Provide a client-friendly HTTP status so the error handler can
    // return a 400 instead of a generic 500.
    const err = new Error("فقط فایل‌های تصویری مجاز است (jpg, png, webp, gif)");
    err.status = 400;
    cb(err);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
