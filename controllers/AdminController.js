import Mentor from "../models/mentor.js";
import User from "../models/User.js";

export const getAllMentors = async (req, res) => {
    try {
      const mentors = await Mentor.find().populate("userId", "name email");
      const formattedMentors = mentors.map((mentor) => ({
        _id: mentor._id.toString(),
        name: mentor.fullName || "Unknown",
        email: mentor.email || "N/A",
        subject: mentor.courses?.[0]?.category || "TBD",
        expertise: mentor.courses?.map((c) => c.courseName) || [],
        status: mentor.status || "pending",
        joinDate: mentor.createdAt ? new Date(mentor.createdAt).toISOString() : new Date().toISOString(),
        lastActive: mentor.lastActive || "Just now",
        totalSessions: mentor.totalSessions || 0,
        rating: mentor.rating || 0,
        studentsHelped: mentor.studentsHelped || 0,
        avatar: mentor.fullName ? mentor.fullName.slice(0, 2).toUpperCase() : "NA",
        verified: mentor.status === "approved",
      }));
      res.json({ success: true, data: formattedMentors });
    } catch (err) {
      console.error("Error fetching mentors:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
  




export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

