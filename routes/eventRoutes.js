import express from "express";
import { getUpcomingEvents } from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/upcoming", protect, getUpcomingEvents);

export default router;
