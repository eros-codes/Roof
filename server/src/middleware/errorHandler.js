const isProd = process.env.NODE_ENV === "production";

export function errorHandler(err, req, res, _next) {
	console.error(`[Error] ${req.method} ${req.path}:`, err);

	// Multer file size limit -> send 413 Payload Too Large with friendly msg
	if (err && err.code === 'LIMIT_FILE_SIZE') {
		const status = 413;
		const message = !isProd ? (err.message || 'حجم فایل بیشتر از حد مجاز است') : 'حجم فایل بیشتر از حد مجاز است';
		res.status(status).json({ error: message });
		return;
	}

	const status = err.status || (err && err.name === 'MulterError' ? 400 : 500);

	// در production جزئیات خطاهای 5xx رو مخفی کن
	const message = (status < 500 || !isProd)
		? (err.message || "خطای داخلی سرور")
		: "خطای داخلی سرور";

	res.status(status).json({ error: message });
}
