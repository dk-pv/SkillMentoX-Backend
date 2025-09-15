import express from "express";
import { handleChat } from "../controllers/chatController.js";
import rateLimiter from "../middleware/rateLimiter.js";


const router = express.Router();

router.post("/ai", rateLimiter, handleChat);

export default router;
