import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
	login,
	getAllReviews, updateReview,   deleteReview,
	getAdminProducts, createProduct, updateProduct, deleteProduct,
	getAdminCategories, createCategory, updateCategory, deleteCategory,
} from "../controllers/admin.controller.js";

const router = Router();

// بدون نیاز به توکن
router.post("/login", login);

// همه‌ی مسیرهای زیر نیاز به JWT دارن
router.use(auth);

// نظرات
router.get("/reviews",     getAllReviews);
router.patch("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

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
