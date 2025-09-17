import express from "express";
import { getAllCourses, getCoursePlan } from "../controllers/courseController.js";

const router = express.Router();

router.get("/", getAllCourses);        // All course categories
router.get("/:stackName", getCoursePlan);  

export default router;
