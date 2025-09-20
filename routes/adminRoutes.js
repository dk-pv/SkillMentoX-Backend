import express from 'express'
import { getMentorRequests, getMentorDetails, updateMentorRequestStatus ,getApprovedMentors , getApprovedMentorsCount ,getValidStudents} from '../controllers/AdminController.js';
import {getVerifiedUsersCount} from '../controllers/authController.js'
import {updateRequestStatus , assignMentorToRequest} from '../controllers/studentRequestController.js'
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



router.put("/:id/status",  protect , authorize('admin') ,  updateRequestStatus);
router.put("/:id/assign-mentor",  protect , authorize('admin') ,  assignMentorToRequest);
router.get("/students/valid", protect, authorize("admin"), getValidStudents);


export default router;