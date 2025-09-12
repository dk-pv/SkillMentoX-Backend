import { sendEmail } from "../utils/sendMail.js"; 
import mongoose from "mongoose";
import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js"; 

export const getMentorRequests = async (req, res) => {
  try {
    const requests = await MentorRequest.find({ status: "pending" })
      .populate("mentorId", "fullName email currentRole");
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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
