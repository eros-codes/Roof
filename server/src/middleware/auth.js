import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { JWT_SECRET } from "../config/env.js";

export async function auth(req, res, next) {
	const header = req.headers.authorization;
	let token = undefined;

	if (header?.startsWith("Bearer ")) {
		token = header.slice(7);
	} else if (req.headers.cookie) {
		// simple cookie parse for roof_admin_token
		const m = req.headers.cookie.match(/(?:^|; )roof_admin_token=([^;]+)/);
		if (m) token = decodeURIComponent(m[1]);
	}

	if (!token) return res.status(401).json({ error: "Unauthorized" });

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		if (!payload || typeof payload.id !== 'number') {
			return res.status(401).json({ error: "توکن نامعتبر یا منقضی شده" });
		}

		const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
		if (!admin) {
			return res.status(401).json({ error: "حساب ادمین دیگر معتبر نیست" });
		}

		req.admin = { id: admin.id, username: admin.username, role: admin.role };
		next();
	} catch (err) {
		res.status(401).json({ error: "توکن نامعتبر یا منقضی شده" });
	}
}
