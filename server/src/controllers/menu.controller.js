import prisma from "../lib/prisma.js";

export async function getCategories(req, res, next) {
	try {
		const categories = await prisma.category.findMany({
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

		const products = await prisma.product.findMany({
			where:   categoryId ? { categoryId: Number(categoryId) } : undefined,
			orderBy: { id: "asc" },
		});

		res.json(products);
	} catch (err) {
		next(err);
	}
}
