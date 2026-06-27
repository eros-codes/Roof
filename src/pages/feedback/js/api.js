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

export async function fetchReviews() {
	const res = await fetch(`${BASE}/reviews`);
	return handleRes(res, "خطا در دریافت نظرات");
}

export async function postReview({ name, text }) {
	const res = await fetch(`${BASE}/reviews`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, text }),
	});
	return handleRes(res, "خطا در ثبت نظر");
}
