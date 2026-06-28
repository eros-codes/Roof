import prisma from "../lib/prisma.js";

export async function getCategories(req, res, next) {
	try {
		const categories = await prisma.category.findMany({
			select: { id: true, name: true, type: true },
			orderBy: { id: "asc" },
		});
		res.json(categories);
	} catch (err) {
		next(err);
	}
}

export async function getProducts(req, res, next) {
	try {
		const { categoryId } = req.query;

		// Validate categoryId if provided
		let where = undefined;
		if (categoryId !== undefined) {
			const num = Number(categoryId);
			if (!Number.isInteger(num) || num < 1) {
				return res.status(400).json({ error: 'categoryId نامعتبر است' });
			}
			where = { categoryId: num };
		}

		const products = await prisma.product.findMany({
			where,
			select: { id: true, name: true, price: true, description: true, image: true, categoryId: true },
			orderBy: { id: "asc" },
		});

		res.json(products);
	} catch (err) {
		next(err);
	}
}
