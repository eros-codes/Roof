import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { loginLimiter } from "../middleware/rateLimiter.js";
import {
	login,
	getAllReviews, updateReview,   deleteReview,
	getAdminProducts, createProduct, updateProduct, deleteProduct,
	getAdminCategories, createCategory, updateCategory, deleteCategory,
	uploadImage,
} from "../controllers/admin.controller.js";

const router = Router();

// بدون نیاز به توکن
router.post("/login", loginLimiter, login);

// همه‌ی مسیرهای زیر نیاز به JWT دارن
router.use(auth);

// نظرات
router.get("/reviews",     getAllReviews);
router.patch("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

// upload image
router.post("/upload", upload.single("image"), uploadImage);

// محصولات
router.get("/products",      getAdminProducts);
router.post("/products",     createProduct);
router.patch("/products/:id",  updateProduct);
router.delete("/products/:id", deleteProduct);

// دسته‌بندی‌ها
router.get("/categories",      getAdminCategories);
router.post("/categories",     createCategory);
router.patch("/categories/:id",  updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;
