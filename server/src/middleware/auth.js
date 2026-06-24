import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { JWT_SECRET } from "../config/env.js";

export async function auth(req, res, next) {
	const header = req.headers.authorization;

	if (!header?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = header.slice(7);

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
