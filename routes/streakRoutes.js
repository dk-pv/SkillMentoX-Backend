import express from "express";
import { getStreak, updateStreak } from "../controllers/streakController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", protect, getStreak);

router.put("/:id", protect, updateStreak);

export default router;
