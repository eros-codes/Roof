export async function handleRes(res, defaultMsg) {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data.error || defaultMsg || `خطای ${res.status}`);
		err.status = res.status;
		throw err;
	}
	return data;
}
