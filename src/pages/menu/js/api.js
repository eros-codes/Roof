import { handleRes } from "../../../lib/handleRes.js";

const API_ORIGIN = (typeof window !== "undefined" && window.__API_ORIGIN__) ? window.__API_ORIGIN__ : "";
const BASE = API_ORIGIN ? `${API_ORIGIN.replace(/\/$/, '')}/api` : "/api";

export async function fetchCategories() {
	const res = await fetch(`${BASE}/categories`);
	return handleRes(res, "خطا در دریافت دسته‌بندی‌ها");
}

export async function fetchProducts(categoryId) {
	const url = categoryId
		? `${BASE}/products?categoryId=${encodeURIComponent(categoryId)}`
		: `${BASE}/products`;
	const res = await fetch(url);
	return handleRes(res, "خطا در دریافت محصولات");
}
