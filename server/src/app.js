import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ALLOWED_ORIGINS } from "./config/env.js";

const app = express();

// Configure `trust proxy` so rate-limiters and IP-derived features
// behave correctly when behind a reverse proxy (nginx, Cloudflare, etc.).
// Use the environment variable `TRUST_PROXY` to allow overriding the
// value in production (e.g. set to '1' when a single proxy is in front).
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback';
app.set('trust proxy', TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "20kb" }));

// Serve frontend static files (including service-worker.js) from project public/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const ADMIN_DIR  = path.join(__dirname, "..", "admin");
const REPO_ROOT  = path.join(__dirname, "..", "..");


const ADMIN_HOST = process.env.ADMIN_HOST || '';
const adminStatic = express.static(ADMIN_DIR);
app.use((req, res, next) => {
	if (ADMIN_HOST && req.hostname === ADMIN_HOST) {
		// Try serving from the admin directory first. If the file is not
		// found, allow the request to fall through so public static
		// middleware (or other routes) can handle shared assets.
		return adminStatic(req, res, (err) => {
			if (err) return next(err);
			return next();
		});
	}
	next();
});
app.use(express.static(PUBLIC_DIR));
// Some pages reference assets with a `/public/...` prefix — expose an
// alias so those URLs continue to work instead of returning JSON 404s.
app.use('/public', express.static(PUBLIC_DIR));

// Expose only the client `src/` folder and the top-level `index.html`.
// Avoid serving the entire repository root which may contain sensitive files.
const CLIENT_SRC_DIR = path.join(REPO_ROOT, 'src');
app.use('/src', express.static(CLIENT_SRC_DIR));
app.get(['/', '/index.html'], (req, res) => {
	res.sendFile(path.join(REPO_ROOT, 'index.html'));
});

// Ensure service worker is always served from project root
app.get('/service-worker.js', (req, res) => {
	res.sendFile(path.join(PUBLIC_DIR, 'service-worker.js'));
});

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
