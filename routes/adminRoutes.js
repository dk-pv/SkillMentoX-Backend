import express from 'express'
import { getMentorRequests, getMentorDetails, updateMentorRequestStatus } from '../controllers/adminController.js';
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


export default router;