import express from "express";
import {
    createRequest,
    getAllRequests,
    getMyRequests,
    updateRequestStatus,
    getAssignedRequests,
    replyToRequest,
    markRequestResolved,
} from "../controllers/studentRequestController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createRequest);
router.get("/my", protect, authorize("student"), getMyRequests);
router.get("/", protect, authorize("admin"), getAllRequests);
router.put("/:id", protect, authorize("admin"), updateRequestStatus);

export default router;
