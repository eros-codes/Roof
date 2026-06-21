import { Router } from "express";
import { getReviews, postReview } from "../controllers/review.controller.js";
import { reviewLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/",  getReviews);
router.post("/", reviewLimiter, postReview);

export default router;
