export const PORT = process.env.PORT || 4000;

// Backwards-compatible: `CLIENT_ORIGIN` kept for single-origin setups
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// Admin UI origin (useful when admin UI is served on a different port)
export const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || "http://localhost:3001";

// Allow a comma-separated list via ALLOWED_ORIGINS, or fall back to the
// common client + admin origins. This is used by the CORS middleware.
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || `${CLIENT_ORIGIN},${ADMIN_ORIGIN}`)
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

// API origin exposed to the admin UI when the server serves `index.html`.
export const API_ORIGIN = process.env.API_ORIGIN || `http://localhost:${PORT}`;

export const JWT_SECRET     = process.env.JWT_SECRET     || "dev-secret-change-in-production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
