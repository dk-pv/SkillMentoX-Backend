import express from "express";
import { getDoubts, createDoubt, getUniqueTags, deleteDoubt } from "../controllers/doubtController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDoubts);
router.post("/", protect, createDoubt);
router.get("/tags", protect, getUniqueTags);
router.delete("/:id", protect, deleteDoubt);

export default router;