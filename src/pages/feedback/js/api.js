const BASE = "http://localhost:4000/api";

export async function fetchReviews() {
	const res = await fetch(`${BASE}/reviews`);
	if (!res.ok) throw new Error("خطا در دریافت نظرات");
	return res.json();
}

export async function postReview({ name, text }) {
	const res = await fetch(`${BASE}/reviews`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, text }),
	});
	if (!res.ok) throw new Error("خطا در ثبت نظر");
	return res.json();
}
