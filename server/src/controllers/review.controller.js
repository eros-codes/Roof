import prisma from "../lib/prisma.js";

export async function getReviews(req, res, next) {
	try {
		const reviews = await prisma.review.findMany({
			where:   { visible: true },
			orderBy: { createdAt: "desc" },
		});
		res.json(reviews);
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
			},
		});

		res.status(201).json(review);
	} catch (err) {
		next(err);
	}
}
