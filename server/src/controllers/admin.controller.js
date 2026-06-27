import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "..", "..", "..", "public", "assets", "images", "products");
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8kdO2yQpQw9P13uX3j9T1g6GteqD6";

async function tryUnlink(filename) {
	if (!filename) return;
	if (filename === 'placeholder.png') return;
	try {
		const p = path.join(PRODUCTS_DIR, filename);
		await fs.unlink(p).catch(() => {});
	} catch (err) {
		// ignore errors — don't block DB updates
	}
}

function isTempUpload(filename) {
	return typeof filename === 'string' && filename.startsWith('temp-');
}

async function cleanupTempUpload(filename) {
	if (isTempUpload(filename)) {
		await tryUnlink(filename);
	}
}

async function cleanupStaleTempUploads() {
	try {
		const files = await fs.readdir(PRODUCTS_DIR);
		const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
		await Promise.all(files.map(async (file) => {
			if (!isTempUpload(file)) return;
			const stats = await fs.stat(path.join(PRODUCTS_DIR, file));
			if (stats.mtimeMs < cutoff) {
				const inUse = await prisma.product.count({ where: { image: file } });
				if (inUse === 0) {
					await fs.unlink(path.join(PRODUCTS_DIR, file));
				}
			}
		}));
	} catch (err) {
		// ignore cleanup failures
	}
}

function parseDurationToMs(value) {
	const str = String(value || '').trim();
	const match = /^([0-9]+)([smhd])$/i.exec(str);
	if (!match) return undefined;
	const amount = Number(match[1]);
	if (Number.isNaN(amount)) return undefined;
	switch (match[2].toLowerCase()) {
		case 'd': return amount * 24 * 60 * 60 * 1000;
		case 'h': return amount * 60 * 60 * 1000;
		case 'm': return amount * 60 * 1000;
		case 's': return amount * 1000;
		default: return undefined;
	}
}

function parsePagination(query) {
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(req, res, next) {
	try {
		const { username, password } = req.body;

		// type check
		if (typeof username !== "string" || typeof password !== "string") {
			return res.status(400).json({ error: "ورودی نامعتبر است" });
		}

		// length check
		if (username.trim().length === 0 || password.length === 0) {
			return res.status(400).json({ error: "نام کاربری و رمز الزامی است" });
		}
		if (username.length > 64 || password.length > 128) {
			return res.status(400).json({ error: "ورودی نامعتبر است" });
		}

		const trimmedUsername = username.trim();
		const admin = await prisma.admin.findUnique({ where: { username: trimmedUsername } });
		const valid = await bcrypt.compare(password, admin ? admin.password : DUMMY_PASSWORD_HASH);
		if (!valid || !admin) {
			return res.status(401).json({ error: "نام کاربری یا رمز اشتباه است" });
		}

		const token = jwt.sign(
			{ id: admin.id, username: admin.username, role: admin.role },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN }
		);

		// Set HttpOnly cookie for the admin token. Client-side JS cannot read
		// this cookie, preventing token theft via XSS. Also return a small
		// non-sensitive success payload for the UI.
		const secure = process.env.NODE_ENV === 'production';
		// Calculate maxAge from JWT_EXPIRES_IN when possible.
		const maxAge = parseDurationToMs(JWT_EXPIRES_IN);

		res.cookie('roof_admin_token', token, {
			httpOnly: true,
			secure,
			sameSite: 'lax',
			...(maxAge ? { maxAge } : {}),
		});

		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

export async function logout(req, res, next) {
	try {
		// Clear the cookie on logout. Use same options as when setting.
		const secure = process.env.NODE_ENV === 'production';
		res.clearCookie('roof_admin_token', { httpOnly: true, secure, sameSite: 'lax' });
		res.json({ success: true });
	} catch (err) { next(err); }
}

export async function getCurrentAdmin(req, res, next) {
	try {
		res.json({ id: req.admin?.id ?? null, username: req.admin?.username ?? null, role: req.admin?.role ?? null });
	} catch (err) {
		next(err);
	}
}

// ─── Admins (management) ───────────────────────────────────────────────────

async function ensureRequesterIsMain(req) {
	return req.admin?.role === 'MAIN';
}

export async function getAdmins(req, res, next) {
	try {
		const pagination = parsePagination(req.query);
		if (pagination && pagination.error) {
			return res.status(400).json({ error: pagination.error });
		}

		if (!pagination) {
			const admins = await prisma.admin.findMany({ select: { id: true, username: true, firstName: true, lastName: true, createdAt: true, role: true }, orderBy: { id: 'asc' } });
			return res.json(admins);
		}

		const [admins, total] = await prisma.$transaction([
			prisma.admin.findMany({ select: { id: true, username: true, firstName: true, lastName: true, createdAt: true, role: true }, orderBy: { id: 'asc' }, skip: pagination.skip, take: pagination.take }),
			prisma.admin.count(),
		]);

		res.json({ data: admins, page: pagination.page, limit: pagination.limit, total });
	} catch (err) {
		next(err);
	}
}

export async function createAdmin(req, res, next) {
	try {
		const isMain = await ensureRequesterIsMain(req);
		if (!isMain) return res.status(403).json({ error: 'دسترسی کافی نیست' });

		let { username, password, firstName, lastName, role } = req.body || {};
		if (typeof username !== 'string' || !username.trim()) return res.status(400).json({ error: 'نام کاربری الزامی است' });
		if (typeof password !== 'string' || password.length < 4) return res.status(400).json({ error: 'رمز عبور نامعتبر است' });
		firstName = typeof firstName === 'string' && firstName.trim() ? firstName.trim() : 'admin';
		lastName = typeof lastName === 'string' && lastName.trim() ? lastName.trim() : 'admin';
		const VALID = ['MAIN', 'SECONDARY'];
		if (!VALID.includes(role)) role = 'SECONDARY';

		const existing = await prisma.admin.findUnique({ where: { username: username.trim() } });
		if (existing) return res.status(409).json({ error: 'نام کاربری قبلاً ثبت شده' });

		const hashed = await bcrypt.hash(password, 10);
		const created = await prisma.admin.create({ data: { username: username.trim(), password: hashed, firstName, lastName, role } });
		res.status(201).json({ id: created.id, username: created.username, firstName: created.firstName, lastName: created.lastName, createdAt: created.createdAt, role: created.role });
	} catch (err) { next(err); }
}

export async function updateAdmin(req, res, next) {
	try {
		const isMain = await ensureRequesterIsMain(req);
		if (!isMain) return res.status(403).json({ error: 'دسترسی کافی نیست' });
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'شناسه نامعتبر است' });

		const { username, password, firstName, lastName, role } = req.body || {};
		const data = {};
		if (username !== undefined) {
			const trimmed = String(username).trim();
			if (!trimmed) return res.status(400).json({ error: 'نام کاربری الزامی است' });
			const existing = await prisma.admin.findUnique({ where: { username: trimmed } });
			if (existing && existing.id !== id) return res.status(409).json({ error: 'نام کاربری قبلاً ثبت شده' });
			data.username = trimmed;
		}
		if (firstName !== undefined) data.firstName = String(firstName).trim() || 'admin';
		if (lastName !== undefined) data.lastName = String(lastName).trim() || 'admin';
		if (role !== undefined) {
			const VALID = ['MAIN', 'SECONDARY']; if (!VALID.includes(role)) return res.status(400).json({ error: 'نقش نامعتبر است' }); data.role = role;
		}
		if (password !== undefined) {
			if (typeof password !== 'string' || password.length < 4) return res.status(400).json({ error: 'رمز عبور نامعتبر است' });
			data.password = await bcrypt.hash(password, 10);
		}
		// Prevent removing the last MAIN admin by demoting them to SECONDARY.
		if (data.role === 'SECONDARY') {
			const target = await prisma.admin.findUnique({ where: { id } });
			if (target && target.role === 'MAIN') {
				const mainCount = await prisma.admin.count({ where: { role: 'MAIN' } });
				if (mainCount <= 1) {
					return res.status(400).json({ error: 'حداقل باید یک ادمین با نقش MAIN وجود داشته باشد. عملیات انجام نشد.' });
				}
			}
		}

		const updated = await prisma.admin.update({ where: { id }, data });
		res.json({ id: updated.id, username: updated.username, firstName: updated.firstName, lastName: updated.lastName, createdAt: updated.createdAt, role: updated.role });
	} catch (err) { next(err); }
}

export async function deleteAdmin(req, res, next) {
	try {
		const isMain = await ensureRequesterIsMain(req);
		if (!isMain) return res.status(403).json({ error: 'دسترسی کافی نیست' });
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'شناسه نامعتبر است' });
		// ensure we don't delete the last MAIN admin
		const target = await prisma.admin.findUnique({ where: { id } });
		if (!target) return res.status(404).json({ error: 'ادمین یافت نشد' });
		if (target.role === 'MAIN') {
			const mainCount = await prisma.admin.count({ where: { role: 'MAIN' } });
			if (mainCount <= 1) {
				return res.status(400).json({ error: 'حداقل باید یک ادمین با نقش MAIN وجود داشته باشد. حذف انجام نشد.' });
			}
		}
		await prisma.admin.delete({ where: { id } });
		res.json({ success: true });
	} catch (err) { next(err); }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getAllReviews(req, res, next) {
	try {
		const pagination = parsePagination(req.query);
		if (pagination && pagination.error) {
			return res.status(400).json({ error: pagination.error });
		}

		if (!pagination) {
			const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
			return res.json(reviews);
		}

		const [reviews, total] = await prisma.$transaction([
			prisma.review.findMany({
				orderBy: { createdAt: "desc" },
				skip: pagination.skip,
				take: pagination.take,
			}),
			prisma.review.count(),
		]);

		res.json({ data: reviews, page: pagination.page, limit: pagination.limit, total });
	} catch (err) {
		next(err);
	}
}

export async function updateReview(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}
		const { visible, reply } = req.body;

		if (visible !== undefined && typeof visible !== "boolean") {
			return res.status(400).json({ error: "مقدار visible باید boolean باشد" });
		}
		if (reply !== undefined && reply !== null && typeof reply !== "string") {
			return res.status(400).json({ error: "متن پاسخ نامعتبر است" });
		}
		if (reply && reply.length > 500) {
			return res.status(400).json({ error: "پاسخ حداکثر ۵۰۰ کاراکتر است" });
		}

		const review = await prisma.review.update({
			where: { id },
			data: {
				...(visible !== undefined && { visible }),
				...(reply !== undefined && { reply }),
				updatedById: req.admin?.id,
			},
		});

		res.json(review);
	} catch (err) {
		next(err);
	}
}

export async function deleteReview(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}
		await prisma.review.delete({ where: { id } });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAdminProducts(req, res, next) {
	try {
		const pagination = parsePagination(req.query);
		if (pagination && pagination.error) {
			return res.status(400).json({ error: pagination.error });
		}

		if (!pagination) {
			const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
			return res.json(products);
		}

		const [products, total] = await prisma.$transaction([
			prisma.product.findMany({ orderBy: { id: "asc" }, skip: pagination.skip, take: pagination.take }),
			prisma.product.count(),
		]);

		res.json({ data: products, page: pagination.page, limit: pagination.limit, total });
	} catch (err) {
		next(err);
	}
}

export async function createProduct(req, res, next) {
	let imageFilename;
	try {
		const { name, price, description, image, categoryId } = req.body;
		imageFilename = image;

		if (typeof name !== "string" || !name.trim()) {
			return res.status(400).json({ error: "نام محصول الزامی است" });
		}
		if (Number.isNaN(Number(price)) || Number(price) < 0) {
			return res.status(400).json({ error: "قیمت نامعتبر است" });
		}
		if (categoryId === undefined || Number.isNaN(Number(categoryId)) || Number(categoryId) < 1) {
			return res.status(400).json({ error: "شناسه دسته‌بندی نامعتبر است" });
		}
		if (description !== undefined && description !== null && typeof description !== "string") {
			return res.status(400).json({ error: "توضیحات نامعتبر است" });
		}
		if (image !== undefined && typeof image !== "string") {
			return res.status(400).json({ error: "نام فایل تصویر نامعتبر است" });
		}

		const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
		if (!category) {
			return res.status(404).json({ error: "دسته‌بندی پیدا نشد" });
		}

		const product = await prisma.product.create({
			data: {
				name: name.trim(),
				price:      Number(price),
				description: description || "",
				image:       image || "placeholder.png",
				categoryId: Number(categoryId),
				createdById: req.admin?.id,
				updatedById: req.admin?.id,
			},
		});

		res.status(201).json(product);
	} catch (err) {
		if (isTempUpload(imageFilename)) {
			await cleanupTempUpload(imageFilename);
		}
		next(err);
	}
}

export async function updateProduct(req, res, next) {
	let existing;
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}
		const { name, price, description, image, categoryId } = req.body;

		if (name !== undefined && typeof name !== "string") {
			return res.status(400).json({ error: "نام محصول نامعتبر است" });
		}
		if (price !== undefined && Number.isNaN(Number(price))) {
			return res.status(400).json({ error: "قیمت نامعتبر است" });
		}
		if (description !== undefined && description !== null && typeof description !== "string") {
			return res.status(400).json({ error: "توضیحات نامعتبر است" });
		}
		if (image !== undefined && typeof image !== "string") {
			return res.status(400).json({ error: "نام فایل تصویر نامعتبر است" });
		}
		if (categoryId !== undefined && (!Number.isInteger(Number(categoryId)) || Number(categoryId) < 1)) {
			return res.status(400).json({ error: "شناسه دسته‌بندی نامعتبر است" });
		}

		existing = await prisma.product.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({ error: "محصول یافت نشد" });
		}

		if (categoryId !== undefined) {
			const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
			if (!category) {
				return res.status(404).json({ error: "دسته‌بندی پیدا نشد" });
			}
		}

		const shouldUnlink = image !== undefined && existing.image && image !== existing.image && existing.image !== 'placeholder.png';
		const product = await prisma.product.update({
			where: { id },
			data: {
				...(name        !== undefined && { name: name.trim() }),
				...(price       !== undefined && { price: Number(price) }),
				...(description !== undefined && { description }),
				...(image       !== undefined && { image }),
				...(categoryId  !== undefined && { categoryId: Number(categoryId) }),
				updatedById: req.admin?.id,
			},
		});

		if (shouldUnlink) {
			await tryUnlink(existing.image);
		}

		res.json(product);
	} catch (err) {
		try {
			// Only cleanup temp upload if it's a temp file and differs
			// from the already-existing product image (to avoid deleting
			// the product's current persistent image when no change was intended).
			if (isTempUpload(req.body?.image) && (!existing || req.body.image !== existing.image)) {
				await cleanupTempUpload(req.body.image);
			}
		} catch (cleanupErr) {
			// swallow cleanup errors but keep original error flowing
			console.error('Failed to cleanup temp upload during updateProduct catch:', cleanupErr);
		}
		next(err);
	}
}

export async function deleteProduct(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}
		const existing = await prisma.product.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({ error: "محصول یافت نشد" });
		}

		await prisma.product.delete({ where: { id } });
		if (existing.image && existing.image !== 'placeholder.png') {
			await tryUnlink(existing.image);
		}

		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminCategories(req, res, next) {
	try {
		const pagination = parsePagination(req.query);
		if (pagination && pagination.error) {
			return res.status(400).json({ error: pagination.error });
		}

		if (!pagination) {
			const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
			return res.json(categories);
		}

		const [categories, total] = await prisma.$transaction([
			prisma.category.findMany({ orderBy: { id: "asc" }, skip: pagination.skip, take: pagination.take }),
			prisma.category.count(),
		]);

		res.json({ data: categories, page: pagination.page, limit: pagination.limit, total });
	} catch (err) {
		next(err);
	}
}

export async function createCategory(req, res, next) {
	try {
		let { name, type } = req.body;

		if (!name || !type) {
			return res.status(400).json({ error: "نام و نوع دسته‌بندی الزامی است" });
		}

		name = String(name).trim();
		type = String(type).trim();

		const VALID_TYPES = ["cafe", "restaurant", "breakfast"];
		if (!VALID_TYPES.includes(type)) {
			return res.status(400).json({ error: "نوع دسته‌بندی نامعتبر است" });
		}

		// Try create; if a P2002 unique constraint on `id` happens (sequence out-of-sync),
		// attempt to re-sync the Postgres sequence and retry once.
		try {
			const category = await prisma.category.create({ data: { name, type, createdById: req.admin?.id, updatedById: req.admin?.id } });
			res.status(201).json(category);
			return;
		} catch (createErr) {
			if (createErr && createErr.code === 'P2002' && createErr.meta && Array.isArray(createErr.meta.target) && createErr.meta.target.includes('id')) {
				// Re-sync serial sequence to max(id) and retry
				await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('categories','id'), (SELECT COALESCE(MAX(id), 1) FROM categories))`;
				const category = await prisma.category.create({ data: { name, type, createdById: req.admin?.id, updatedById: req.admin?.id } });
				res.status(201).json(category);
				return;
			}
			throw createErr;
		}
	} catch (err) {
		next(err);
	}
}

export async function updateCategory(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}
		const { name, type } = req.body;

		if (name !== undefined && typeof name !== "string") {
			return res.status(400).json({ error: "نام دسته‌بندی نامعتبر است" });
		}
		if (type !== undefined && typeof type !== "string") {
			return res.status(400).json({ error: "نوع دسته‌بندی نامعتبر است" });
		}

		const VALID_TYPES = ["cafe", "restaurant", "breakfast"];
		if (type !== undefined && !VALID_TYPES.includes(type)) {
			return res.status(400).json({ error: "نوع دسته‌بندی نامعتبر است" });
		}

		const category = await prisma.category.update({
			where: { id },
			data: {
				...(name && { name }),
				...(type && { type }),
				updatedById: req.admin?.id,
			},
		});

		res.json(category);
	} catch (err) {
		next(err);
	}
}

export async function deleteCategory(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: "شناسه نامعتبر است" });
		}

		const category = await prisma.category.findUnique({ where: { id } });
		if (!category) {
			return res.status(404).json({ error: "دسته‌بندی پیدا نشد" });
		}

		const productCount = await prisma.product.count({ where: { categoryId: id } });
		if (productCount > 0) {
			return res.status(400).json({ error: "ابتدا محصولات این دسته را حذف یا منتقل کنید." });
		}

		try {
			await prisma.category.delete({ where: { id } });
			res.json({ success: true });
		} catch (deleteErr) {
			if (deleteErr && deleteErr.code === 'P2014') {
				return res.status(400).json({ error: "ابتدا محصولات این دسته را حذف یا منتقل کنید." });
			}
			throw deleteErr;
		}
	} catch (err) {
		next(err);
	}
}

// ─── Upload Image ───────────────────────────────────────────────────────
export async function uploadImage(req, res, next) {
	try {
		await cleanupStaleTempUploads();
		if (!req.file) {
			return res.status(400).json({ error: "فایلی ارسال نشد" });
		}
		res.json({ filename: req.file.filename });
	} catch (err) {
		if (req.file?.filename) {
			await cleanupTempUpload(req.file.filename);
		}
		next(err);
	}
}
