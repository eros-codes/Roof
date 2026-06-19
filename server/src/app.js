import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { CLIENT_ORIGIN } from "./config/env.js";
import router from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ─── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// ─── Admin panel (static) ─────────────────────────────────────────────────────
// فرانت ادمین از پوشه admin/ سرو میشه — روی port 4000 قابل دسترسه
app.use(express.static(path.join(__dirname, "..", "admin")));

// ─── API ──────────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
