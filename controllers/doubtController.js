import Doubt from "../models/Doubt.js";
import StudentProfile from "../models/StudentProfile.js";

export const getDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: doubts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createDoubt = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Student profile not found" });
    }

    const doubt = await Doubt.create({
      question,
      tag: profile.selectedStack, 
      userId: req.user._id,
      status: "Pending",
    });

    res.status(201).json({ success: true, data: doubt });
  } catch (error) {
    console.error("Error creating doubt:", error);
    res.status(500).json({ success: false, message: "Failed to create doubt" });
  }
};

export const getUniqueTags = async (req, res) => {
  try {
    const tags = await Doubt.distinct("tag", { userId: req.user._id });
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res
        .status(404)
        .json({ success: false, message: "Doubt not found" });
    }
    if (doubt.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this doubt",
        });
    }
    await doubt.deleteOne();
    res.json({ success: true, message: "Doubt deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
