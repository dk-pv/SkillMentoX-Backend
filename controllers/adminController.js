import { sendEmail } from "../utils/sendMail.js"; 
import mongoose from "mongoose";
import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js"; 



export const getMentorRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 10; // default limit 10
    const skip = (page - 1) * limit;

    const total = await MentorRequest.countDocuments({ status: "pending" });

    const requests = await MentorRequest.find({ status: "pending" })
      .populate("mentorId", "fullName email currentRole")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest first

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const updateMentorRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body; // "approved" | "rejected"

  if (!["approved", "rejected"].includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const request = await MentorRequest.findById(id).populate("mentorId");

    if (!request) {
      return res.status(404).json({ message: "Mentor request not found" });
    }

    request.status = newStatus;

    // Soft delete if rejected
    if (newStatus === "rejected") {
      request.isDeleted = true;
    }

    await request.save();

    // Send email notification
    const emailContent = `
      <h1>Your Mentor Request has been ${newStatus}</h1>
      <p>Hello ${request.mentorId.fullName},</p>
      <p>Your mentor application has been <strong>${newStatus}</strong>.</p>
      <p>Thank you for your interest in joining SkillMentorX as a mentor!</p>
    `;

    await sendEmail({
      to: request.mentorId.email,
      subject: `Mentor Request ${newStatus}`,
      html: emailContent,
    });

    return res.status(200).json({
      success: true,
      message: `Mentor request ${newStatus}${newStatus === "rejected" ? " (soft deleted)" : ""} and email sent successfully.`,
    });
  } catch (error) {
    console.error("Error updating mentor request status:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};



export const getMentorDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid mentor ID" });
  }

  try {
    const mentor = await Mentor.findById(id);

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.status(200).json({ success: true, data: mentor });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};




export const getApprovedMentors = async (req, res) => {
  try {
    // Get page & limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await MentorRequest.countDocuments({
      status: "approved",
      isDeleted: false,
    });

    const approvedMentors = await MentorRequest.find({
      status: "approved",
      isDeleted: false,
    })
      .populate("mentorId")
      .skip(skip)
      .limit(limit);

    const mentors = approvedMentors.map((req) => req.mentorId);

    res.status(200).json({
      success: true,
      data: mentors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching approved mentors:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
