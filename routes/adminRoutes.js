import express from 'express'
import { getMentorRequests, getMentorDetails, updateMentorRequestStatus ,getApprovedMentors , getApprovedMentorsCount} from '../controllers/adminController.js';
import {getVerifiedUsersCount} from '../controllers/authController.js'
import { protect , authorize } from '../middleware/authMiddleware.js';

const router = express.Router()
router.get(
  "/mentor-requests",
  protect,
  authorize("admin"),
  getMentorRequests
);

router.put(
  "/approve-request/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    req.body.newStatus = "approved";
    await updateMentorRequestStatus(req, res);
  }
);

router.put(
  "/reject-request/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    req.body.newStatus = "rejected";
    await updateMentorRequestStatus(req, res);
  }
);

router.get(
  "/mentor/:id",
  protect,
  authorize("admin"),
  getMentorDetails    
);

router.get("/approved-mentors" , protect , authorize('admin') , getApprovedMentors)


// admin dashboard real time 
router.get("/approved/count", protect , authorize('admin') , getApprovedMentorsCount)
router.get("/totalUsers", protect , authorize('admin') , getVerifiedUsersCount)



export default router;