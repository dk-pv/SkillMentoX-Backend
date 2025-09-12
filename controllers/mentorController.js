import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js"; // Import MentorRequest
import { courseCategories } from "../data/courseCategories.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import { mentorProfileSchema } from "../validation/mentorValidation.js";
import { sendEmail } from "../utils/sendMail.js"; // your existing email util


import mongoose from "mongoose";


const isValidCourse = (category, courseName) => {
  if (!courseCategories[category]) return false;
  const availableCourses =
    courseCategories[category].Stacks ||
    courseCategories[category].Languages ||
    [];
  return availableCourses.includes(courseName);
};

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const createOrUpdateMentorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName,
      headline,
      bio,
      currentRole,
      company,
      yearsOfExperience,
      email,
      phoneNumber,
      gender,
      linkedin,
      github,
      portfolio,
    } = req.body;

    const education = parseJSON(req.body.education, []);
    const certifications = parseJSON(req.body.certifications, []);
    const courses = parseJSON(req.body.courses, []);
    const { error } = mentorProfileSchema.validate(
      {
        fullName,
        headline,
        bio,
        currentRole,
        company,
        yearsOfExperience:
          yearsOfExperience !== undefined
            ? Number(yearsOfExperience)
            : undefined,
        email,
        phoneNumber,
        gender,
        linkedin,
        github,
        portfolio,
        education,
        certifications,
        courses,
      },
      { abortEarly: false }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    // Validate courses manually
    if (Array.isArray(courses) && courses.length) {
      for (const c of courses) {
        if (!c?.category || !c?.courseName) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid course payload format. Must have category + courseName",
          });
        }
        if (!isValidCourse(c.category, c.courseName)) {
          return res.status(400).json({
            success: false,
            message: `Invalid course: ${c.category} > ${c.courseName}`,
          });
        }
      }
    }

    let profilePictureUrl = "";
    let idProofUrl = "";
    let qualificationProofUrl = "";

    if (req.files?.profilePicture?.[0]) {
      const up = await uploadBufferToCloudinary(
        req.files.profilePicture[0],
        "mentors/profile"
      );
      profilePictureUrl = up.secure_url;
    }
    if (req.files?.idProof?.[0]) {
      const up = await uploadBufferToCloudinary(
        req.files.idProof[0],
        "mentors/documents"
      );
      idProofUrl = up.secure_url;
    }
    if (req.files?.qualificationProof?.[0]) {
      const up = await uploadBufferToCloudinary(
        req.files.qualificationProof[0],
        "mentors/documents"
      );
      qualificationProofUrl = up.secure_url;
    }

    const data = {
      fullName,
      headline,
      bio,
      currentRole,
      company,
      email,
      phoneNumber,
      gender,
      linkedin,
      github,
      portfolio,
      education,
      certifications,
      courses,
    };

    if (yearsOfExperience !== undefined)
      data.yearsOfExperience = Number(yearsOfExperience) || 0;
    if (profilePictureUrl) data.profilePicture = profilePictureUrl;

    data.documents = {};
    if (idProofUrl) data.documents.idProof = idProofUrl;
    if (qualificationProofUrl)
      data.documents.qualificationProof = qualificationProofUrl;

    let mentor = await Mentor.findOne({ userId });

    if (mentor) {
      // Existing mentor → update profile
      mentor = await Mentor.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true }
      );

      return res
        .status(200)
        .json({ success: true, message: "Profile updated", data: mentor });
    } else {
      // New mentor → create profile AND send request to admin
      const newMentor = await Mentor.create({ userId, ...data });

      // Create MentorRequest for admin approval
      await MentorRequest.create({
        mentorId: newMentor._id,
        action: "create",
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Profile created and sent for admin approval",
        data: newMentor,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};






export const getMentorProfile = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.user.id });
    if (!mentor)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    res.json({ success: true, data: mentor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};






export const deleteMentorDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { docType, url } = req.body;

    if (!docType || !url) {
      return res.status(400).json({
        success: false,
        message: "docType and url are required",
      });
    }

    const mentor = await Mentor.findOneAndUpdate(
      { userId },
      { $pull: { [`documents.${docType}`]: url } },
      { new: true }
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document deleted",
      data: mentor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};






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
