export const PORT = process.env.PORT || 4000;

// Backwards-compatible: `CLIENT_ORIGIN` kept for single-origin setups
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// Allow a comma-separated list via ALLOWED_ORIGINS, or fall back to CLIENT_ORIGIN.
// This is used by the CORS middleware.
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_ORIGIN)
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

export const JWT_SECRET     = process.env.JWT_SECRET     || "dev-secret-change-in-production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Validate JWT_EXPIRES_IN format
if (!/^\d+[smhd]$/i.test(JWT_EXPIRES_IN)) {
	throw new Error('JWT_EXPIRES_IN باید با فرمت <عدد><s|m|h|d> باشد، مثلا "7d"');
}

// Fail fast in production if a secret is not provided. Using a public
// fallback in production allows token forgery and must be prevented.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}
