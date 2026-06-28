export function parsePagination(query) {
	const pageParam = query.page;
	const limitParam = query.limit;
	if (pageParam === undefined && limitParam === undefined) return null;

	const page = pageParam !== undefined ? Number(pageParam) : 1;
	const limit = limitParam !== undefined ? Number(limitParam) : 20;
	if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
		return { error: 'page و limit باید اعداد صحیح مثبت باشند و limit نباید بیشتر از 100 باشد.' };
	}
	return { skip: (page - 1) * limit, take: limit, page, limit };
}
