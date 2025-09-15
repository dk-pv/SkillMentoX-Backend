import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js"; 
import { courseCategories } from "../data/courseCategories.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import { mentorProfileSchema } from "../validation/mentorValidation.js";

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
      // New mentor → create profile AND send request to admin
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