import prisma from "../lib/prisma.js";
import { parsePagination } from "../lib/pagination.js";

export async function getReviews(req, res, next) {
	try {
		const pagination = parsePagination(req.query);
		if (pagination && pagination.error) {
			return res.status(400).json({ error: pagination.error });
		}

		if (!pagination) {
			const reviews = await prisma.review.findMany({
				where:   { visible: true },
				select: { id: true, name: true, text: true, reply: true, createdAt: true },
				orderBy: { createdAt: "desc" },
			});
			return res.json(reviews);
		}

		const [reviews, total] = await prisma.$transaction([
			prisma.review.findMany({
				where: { visible: true },
				select: { id: true, name: true, text: true, reply: true, createdAt: true },
				orderBy: { createdAt: "desc" },
				skip: pagination.skip,
				take: pagination.take,
			}),
			prisma.review.count({ where: { visible: true } }),
		]);

		res.json({ data: reviews, page: pagination.page, limit: pagination.limit, total });
	} catch (err) {
		next(err);
	}
}

export async function postReview(req, res, next) {
	try {
		const { name, text } = req.body;

		// type check
		if (typeof text !== "string") {
			return res.status(400).json({ error: "متن نظر نامعتبر است" });
		}
		if (name !== undefined && name !== null && typeof name !== "string") {
			return res.status(400).json({ error: "نام نامعتبر است" });
		}

		// length check
		if (!text.trim()) {
			return res.status(400).json({ error: "متن نظر الزامی است" });
		}
		if (text.length > 500) {
			return res.status(400).json({ error: "متن نظر حداکثر ۵۰۰ کاراکتر است" });
		}
		if (name && name.length > 100) {
			return res.status(400).json({ error: "نام حداکثر ۱۰۰ کاراکتر است" });
		}

		const review = await prisma.review.create({
			data: {
				name: name?.trim() || null,
				text: text.trim(),
				visible: false,
				createdById: null,
				updatedById: null,
			},
		});

		res.status(201).json({ id: review.id, name: review.name, text: review.text, createdAt: review.createdAt });
	} catch (err) {
		next(err);
	}
}
