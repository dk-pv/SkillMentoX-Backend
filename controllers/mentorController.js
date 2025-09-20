import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js";

import { courseCategories } from "../data/courseCategories.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import { mentorProfileSchema } from "../validation/mentorValidation.js";
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
      mentor = await Mentor.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true }
      );

      return res
        .status(200)
        .json({ success: true, message: "Profile updated", data: mentor });
    } else {
      const newMentor = await Mentor.create({ userId, ...data });

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


export const approveMentorRequest = async (req, res) => {
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

export const getMentorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mentor ID" });
    }

    const mentor = await Mentor.findById(id)
      .populate("userId", "name email role")
      .lean();

    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }

    res.status(200).json({ success: true, data: mentor });
  } catch (error) {
    console.error(" Error fetching mentor details:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const createMentorRequest = async (req, res) => {
  try {
    const mentor = await Mentor.create({
      userId: req.user.id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Mentor request created successfully",
      data: mentor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMentorDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { docType } = req.body;

    if (!docType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    let mentor = await Mentor.findOne({ userId });
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    if (mentor.documents && mentor.documents[docType]) {
      delete mentor.documents[docType];
      await mentor.save();
      return res.json({
        success: true,
        message: `${docType} deleted successfully`,
        data: mentor,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `${docType} not found`,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMentorRequests = async (req, res) => {
  try {
    const mentors = await Mentor.find({
      status: { $in: ["pending", "approved", "rejected"] },
    }).populate("userId", "name email");

    res.json({
      success: true,
      data: mentors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectMentorRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const mentor = await Mentor.findByIdAndUpdate(
      requestId,
      { status: "rejected", rejectionReason: reason || "No reason provided" },
      { new: true }
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor request not found",
      });
    }

    res.json({
      success: true,
      message: "Mentor request rejected",
      data: mentor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getApprovedStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const mentor = await Mentor.findOne({ userId }).populate(
      "approvedStudents"
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mentor.approvedStudents || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
