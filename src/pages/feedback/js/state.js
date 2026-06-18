import { fetchReviews } from "./api.js";

export const reviews = [];
export let isLoading = false;
export let error = null;

/**
 * Load reviews from backend and populate `reviews` array.
 * Does not auto-run — call once during app initialization when backend is available.
 * @param {{url?: string, signal?: AbortSignal}} [opts]
 * @returns {Promise<any[]>}
 */
export async function loadReviews({ url = "/api/reviews", signal } = {}) {
	if (isLoading) return reviews;

	isLoading = true;
	error = null;

	try {
		const arr = await fetchReviews({ url, signal });
		if (!Array.isArray(arr)) throw new Error("Invalid response shape from /api/reviews");

		reviews.length = 0;
		reviews.push(...arr);

		return reviews;
	} catch (err) {
		error = err;
		throw err;
	} finally {
		isLoading = false;
	}
}
