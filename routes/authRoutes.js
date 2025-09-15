import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp
} from "../controllers/authController.js";



const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post('/resend-otp', resendOtp)

router.post("/login", login);


router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;