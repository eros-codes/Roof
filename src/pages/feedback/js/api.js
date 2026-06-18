/**
 * Feedback API helpers (page-local).
 * This file is intentionally standalone and NOT imported anywhere.
 */
export async function fetchReviews({ url = "/api/reviews", signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.reviews ?? [];
}

export async function postReview(review, { url = "/api/reviews", signal } = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
    signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => null);
    throw new Error(body || `POST ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
