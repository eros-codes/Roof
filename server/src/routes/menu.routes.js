import { Router } from "express";
import { getCategories, getProducts } from "../controllers/menu.controller.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/products",   getProducts);

export default router;
