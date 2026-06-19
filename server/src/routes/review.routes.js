import { Router } from "express";
import { getReviews, postReview } from "../controllers/review.controller.js";

const router = Router();

router.get("/",  getReviews);
router.post("/", postReview);

export default router;
