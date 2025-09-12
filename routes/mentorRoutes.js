import express from "express";
import {
  createOrUpdateMentorProfile,
  deleteMentorDocument,
  getMentorProfile,
  getMentorRequests,
  getMentorDetails,
  updateMentorRequestStatus
} from "../controllers/mentorController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { courseCategories } from "../data/courseCategories.js";

const router = express.Router();

// Course categories
router.get("/courseCategories", (req, res) => {
  res.json({ success: true, data: courseCategories });
});

router.post(
  "/updateProfile",
  protect,
  authorize("mentor"),
  upload.fields([
    { name: "profilePicture", maxCount: 1 }, 
    { name: "idProof", maxCount: 1 }, 
    { name: "qualificationProof", maxCount: 1 }, 
    { name: "cv", maxCount: 1 },
  ]),
  createOrUpdateMentorProfile
);

router.get("/profile", protect, getMentorProfile);
router.delete("/document", protect, authorize("mentor"), deleteMentorDocument);

router.get(
  "/admin/mentor-requests",
  protect,
  authorize("admin"),
  getMentorRequests
);

router.get(
  "/admin/mentor/:id",
  protect,
  authorize("admin"),
  getMentorDetails    
);

// Approve Request
router.put(
  "/admin/approve-request/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    req.body.newStatus = "approved";
    await updateMentorRequestStatus(req, res);
  }
);

// Reject Request
router.put(
  "/admin/reject-request/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    req.body.newStatus = "rejected";
    await updateMentorRequestStatus(req, res);
  }
);







export default router;
