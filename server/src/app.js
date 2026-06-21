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

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "20kb" }));

// Serve frontend static files (including service-worker.js) from project `public/`
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
app.use(express.static(PUBLIC_DIR));

// Ensure service worker is always served from project root
app.get('/service-worker.js', (req, res) => {
	res.sendFile(path.join(PUBLIC_DIR, 'service-worker.js'));
});

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
