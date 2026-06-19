import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(req, res, next) {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "نام کاربری و رمز الزامی است" });
		}

		const admin = await prisma.admin.findUnique({ where: { username } });
		if (!admin) {
			return res.status(401).json({ error: "نام کاربری یا رمز اشتباه است" });
		}

		const valid = await bcrypt.compare(password, admin.password);
		if (!valid) {
			return res.status(401).json({ error: "نام کاربری یا رمز اشتباه است" });
		}

		const token = jwt.sign(
			{ id: admin.id, username: admin.username },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN }
		);

		res.json({ token });
	} catch (err) {
		next(err);
	}
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getAllReviews(req, res, next) {
	try {
		const reviews = await prisma.review.findMany({
			orderBy: { createdAt: "desc" },
		});
		res.json(reviews);
	} catch (err) {
		next(err);
	}
}

export async function updateReview(req, res, next) {
	try {
		const id = Number(req.params.id);
		const { visible, reply } = req.body;

		const review = await prisma.review.update({
			where: { id },
			data: {
				...(visible !== undefined && { visible }),
				...(reply  !== undefined && { reply  }),
			},
		});

		res.json(review);
	} catch (err) {
		next(err);
	}
}

export async function deleteReview(req, res, next) {
	try {
		await prisma.review.delete({ where: { id: Number(req.params.id) } });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAdminProducts(req, res, next) {
	try {
		const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
		res.json(products);
	} catch (err) {
		next(err);
	}
}

export async function createProduct(req, res, next) {
	try {
		const { name, price, description, image, categoryId } = req.body;

		if (!name || price == null || !categoryId) {
			return res.status(400).json({ error: "نام، قیمت و دسته‌بندی الزامی است" });
		}

		const product = await prisma.product.create({
			data: {
				name,
				price:      Number(price),
				description: description || "",
				image:       image || "placeholder.png",
				categoryId: Number(categoryId),
			},
		});

		res.status(201).json(product);
	} catch (err) {
		next(err);
	}
}

export async function updateProduct(req, res, next) {
	try {
		const id = Number(req.params.id);
		const { name, price, description, image, categoryId } = req.body;

		const product = await prisma.product.update({
			where: { id },
			data: {
				...(name        !== undefined && { name }),
				...(price       !== undefined && { price: Number(price) }),
				...(description !== undefined && { description }),
				...(image       !== undefined && { image }),
				...(categoryId  !== undefined && { categoryId: Number(categoryId) }),
			},
		});

		res.json(product);
	} catch (err) {
		next(err);
	}
}

export async function deleteProduct(req, res, next) {
	try {
		await prisma.product.delete({ where: { id: Number(req.params.id) } });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminCategories(req, res, next) {
	try {
		const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
		res.json(categories);
	} catch (err) {
		next(err);
	}
}

export async function createCategory(req, res, next) {
	try {
		const { name, type } = req.body;

		if (!name || !type) {
			return res.status(400).json({ error: "نام و نوع دسته‌بندی الزامی است" });
		}

		const category = await prisma.category.create({ data: { name, type } });
		res.status(201).json(category);
	} catch (err) {
		next(err);
	}
}

export async function updateCategory(req, res, next) {
	try {
		const id = Number(req.params.id);
		const { name, type } = req.body;

		const category = await prisma.category.update({
			where: { id },
			data: {
				...(name && { name }),
				...(type && { type }),
			},
		});

		res.json(category);
	} catch (err) {
		next(err);
	}
}

export async function deleteCategory(req, res, next) {
	try {
		await prisma.category.delete({ where: { id: Number(req.params.id) } });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}
