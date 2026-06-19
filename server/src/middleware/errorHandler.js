export function errorHandler(err, req, res, next) {
	console.error(`[Error] ${req.method} ${req.path}:`, err.message);

	const status  = err.status  || 500;
	const message = err.message || "خطای داخلی سرور";

	res.status(status).json({ error: message });
}
