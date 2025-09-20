
import StudentProfile from "../models/StudentProfile.js";

export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingProfile = await StudentProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = new StudentProfile({
      userId,
      ...req.body,
    });

    await profile.save();
    res.status(201).json({ data: profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const userId = req.params.id;

    const profile = await StudentProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json({ data: profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ data: profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getStudentStacks = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({ success: true, data: [profile.selectedStack] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

  