import express from "express";
import { createProfile, getProfileById, getStudentStacks, updateProfile } from "../controllers/StudentController.js";
import { protect } from "../middleware/authMiddleware.js";



const StudentRoutes = express.Router()

    .post("/createprofile",protect,createProfile)
    .get("/getprofile/:id",protect,getProfileById )
    .put("/updateprofile/:id",protect, updateProfile)
    .get("/mystacks", protect, getStudentStacks);


export default StudentRoutes;


