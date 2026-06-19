import { Router } from "express";
import menuRoutes   from "./menu.routes.js";
import reviewRoutes from "./review.routes.js";
import adminRoutes  from "./admin.routes.js";

const router = Router();

router.use("/",       menuRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin",   adminRoutes);

export default router;
