import express from "express";
import { createProfile, getProfileById, updateProfile } from "../controllers/StudentController.js";
import { protect } from "../middleware/authMiddleware.js";



const StudentRoutes = express.Router()

    .post("/createprofile",protect,createProfile)
    .get("/getprofile/:id",protect,getProfileById )
    .put("/updateprofile/:id",protect, updateProfile);

export default StudentRoutes;
