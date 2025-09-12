import express from "express";
import {
  createOrUpdateMentorProfile,
  deleteMentorDocument,
  getMentorProfile,
} from "../controllers/mentorController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { courseCategories } from "../data/courseCategories.js";

const router = express.Router();


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





export default router;
