import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export function auth(req, res, next) {
	const header = req.headers.authorization;

	if (!header?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = header.slice(7);

	try {
		req.admin = jwt.verify(token, JWT_SECRET);
		next();
	} catch {
		res.status(401).json({ error: "توکن نامعتبر یا منقضی شده" });
	}
}
