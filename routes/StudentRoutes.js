import express from "express";
import { createProfile, getProfileById, updateProfile } from "../controllers/StudentController.js";



const StudentRoutes = express.Router()

    .post("/createprofile",createProfile)
    .get("/getprofile/:id",getProfileById )
    .put("/updateprofile/:id",updateProfile);

export default StudentRoutes;
