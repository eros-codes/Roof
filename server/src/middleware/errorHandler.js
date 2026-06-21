const isProd = process.env.NODE_ENV === "production";

export function errorHandler(err, req, res, next) {
	console.error(`[Error] ${req.method} ${req.path}:`, err);

	const status = err.status || 500;

	// در production جزئیات خطاهای 5xx رو مخفی کن
	const message = (status < 500 || !isProd)
		? (err.message || "خطای داخلی سرور")
		: "خطای داخلی سرور";

	res.status(status).json({ error: message });
}
