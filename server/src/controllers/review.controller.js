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

		if (!text?.trim()) {
			return res.status(400).json({ error: "متن نظر الزامی است" });
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
