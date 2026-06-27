const API_ORIGIN = (typeof window !== "undefined" && window.__API_ORIGIN__) ? window.__API_ORIGIN__ : "";
const BASE = API_ORIGIN ? `${API_ORIGIN.replace(/\/$/, '')}/api` : "/api";

async function handleRes(res, defaultMsg) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
	const err = new Error(data.error || defaultMsg || `خطای ${res.status}`);
	err.status = res.status;
	throw err;
  }
  return data;
}

export async function fetchCategories() {
	const res = await fetch(`${BASE}/categories`);
	return handleRes(res, "خطا در دریافت دسته‌بندی‌ها");
}

export async function fetchProducts(categoryId) {
	const url = categoryId
		? `${BASE}/products?categoryId=${categoryId}`
		: `${BASE}/products`;
	const res = await fetch(url);
	return handleRes(res, "خطا در دریافت محصولات");
}
