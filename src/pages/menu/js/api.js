const BASE = "http://localhost:4000/api";

export async function fetchCategories() {
	const res = await fetch(`${BASE}/categories`);
	if (!res.ok) throw new Error("خطا در دریافت دسته‌بندی‌ها");
	return res.json();
}

export async function fetchProducts(categoryId) {
	const url = categoryId
		? `${BASE}/products?categoryId=${categoryId}`
		: `${BASE}/products`;
	const res = await fetch(url);
	if (!res.ok) throw new Error("خطا در دریافت محصولات");
	return res.json();
}
