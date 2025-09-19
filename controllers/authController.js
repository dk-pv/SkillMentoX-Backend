import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../utils/sendMail.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/authValidation.js";
import User from "../models/User.js";
import TempUser from "../models/tempUser.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      provider: user.provider,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { firstName, lastName, email, password, role } = req.body;

    if (!["mentor", "student","admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existingUser = await User.findOne({ email });
    const existingTempUser = await TempUser.findOne({ email });
    if (existingUser || existingTempUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create temporary user
    const tempUser = new TempUser({
      firstName,
      lastName,
      email,
      password,
      role,
      provider: "email",
      otpCode: crypto.createHash("sha256").update(otp).digest("hex"),
      otpExpires: Date.now() + 10 * 60 * 1000,
    });
    await tempUser.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Verify Your Email - OTP",
      html: `<p>Your OTP code is: <b>${otp}</b>. It expires in 10 minutes.</p>
              <p>You are registering as a <b>${role}</b>.</p>`,
    });

    res.status(201).json({
      message: "OTP sent to your email. Please verify.",
      userId: tempUser._id,
      role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Find temporary user
    const tempUser = await TempUser.findOne({
      _id: userId,
      otpCode: hashedOtp,
      otpExpires: { $gt: Date.now() },
    });

    if (!tempUser) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Create permanent user in User collection
    const user = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      email: tempUser.email,
      password: tempUser.password,
      role: tempUser.role,
      provider: tempUser.provider,
      isVerified: true,
    });
    await user.save();

    // Delete temporary user
    await TempUser.deleteOne({ _id: userId });


    await sendEmail({
      to: user.email,
      subject: "Welcome to SkillMentroX 🎉",
      html: `<p>Hi ${user.firstName},</p>
              <p>Welcome to SkillMentroX! You are now registered as a <b>${user.role}</b>.</p>
              <p>Get started by logging in and exploring our platform.</p>`,
    });

    const token = generateToken(user);

    res.json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res
        .status(400)
        .json({ message: "User ID and email are required" });
    }


    const tempUser = await TempUser.findOne({ _id: userId, email });
    if (!tempUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already registered and verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUser.otpCode = crypto.createHash("sha256").update(otp).digest("hex");
    tempUser.otpExpires = Date.now() + 10 * 60 * 1000;
    await tempUser.save();

    // Send OTP email
    await sendEmail({
      to: tempUser.email,
      subject: "Verify Your Email - OTP",
      html: `<p>Your new OTP code is: <b>${otp}</b>. It expires in 10 minutes.</p>
             <p>You are registering as a <b>${tempUser.role}</b>.</p>`,
    });

    res.json({
      message: "New OTP sent to your email",
      userId: tempUser._id,
      role: tempUser.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      message: "Logged in",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link was sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
    const html = `
      <p>You requested a password reset</p>
      <p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `;

    try {
      await sendEmail({ to: user.email, subject: "Password Reset", html });
      res.json({ message: "Reset link sent to email" });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error("Email send error:", emailErr);
      res.status(500).json({ message: "Could not send email" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { error } = resetPasswordSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful",
      html: `<p>Your password has been updated.</p>`,
    });

    const tokenJwt = generateToken(user);
    res.json({ message: "Password updated", token: tokenJwt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get count of verified users
export const getVerifiedUsersCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ isVerified: true });

    res.json({
      success: true,
      verifiedUsersCount: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
