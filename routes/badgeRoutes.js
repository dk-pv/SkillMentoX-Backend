import express from "express";
import { getBadgesByStudent } from "../controllers/badgeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/badges/:id", protect, getBadgesByStudent);

export default router;
