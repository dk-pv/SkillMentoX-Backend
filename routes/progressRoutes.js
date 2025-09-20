import express from "express";
import { getProgress, updateProgress } from "../controllers/progressController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", protect, getProgress);

router.put("/:id", protect, updateProgress);

export default router;
