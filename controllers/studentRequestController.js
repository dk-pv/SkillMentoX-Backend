import StudentRequest from "../models/studentRequest.js";
import User from "../models/User.js";
import Mentor from "../models/mentor.js";
import MentorRequest from "../models/MentorRequest.js"



// Create request (Student side)
export const createRequest = async (req, res) => {
  try {
    const { category, stack } = req.body;
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const request = new StudentRequest({
      student: studentId,
      category,
      stack,
      status: "pending",
    });

    await request.save();

    res.status(201).json({ message: "Request created", request });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    const requests = await StudentRequest.find({ student: studentId }).populate(
      "assignedMentor",
      "name expertise"
    );

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching student requests:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};



export const getAllRequests = async (req, res) => {
  try {
    const requests = await StudentRequest.find({
      status: "pending",
      assignedMentor: null,
    })
      .populate("student", "name email")
      .populate("assignedMentor", "name expertise");

    res.json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


// in admin dashboard
export const getRequestsCount = async (req, res) => {
  try {
    const count = await StudentRequest.countDocuments({
      status: "pending",
      assignedMentor: null,
    });

    res.json({
      success: true,
      pendingRequests: count,
    });
  } catch (err) {
    console.error("Error fetching requests count:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};





export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const request = await StudentRequest.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: "Request not found" });

    res.status(200).json({ success: true, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




// export const assignMentorToRequest = async (req, res) => {
//     try {
//         const requestId = req.params.id;
//         const { mentorId } = req.body;

//         const studentRequest = await StudentRequest.findById(requestId);
//         if (!studentRequest) {
//             return res.status(404).json({ success: false, message: "Request not found" });
//         }

//         const mentor = await Mentor.findById(mentorId);
//         if (!mentor) {
//             return res.status(404).json({ success: false, message: "Mentor not found" });
//         }

//         // ✅ Check if mentor has the requested course
//         const isCourseAvailable = mentor.courses.some(
//             (c) => c.courseName.trim() === studentRequest.stack.trim()
//         );

//         if (!isCourseAvailable) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Mentor course does not match student selected course"
//             });
//         }

//         studentRequest.assignedMentor = mentor._id;
//         await studentRequest.save();

//         res.status(200).json({ success: true, request: studentRequest });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };



export const assignMentorToRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const { mentorId } = req.body;

        // ✅ Find student request
        const studentRequest = await StudentRequest.findById(requestId);
        if (!studentRequest) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        // ✅ Find mentor
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: "Mentor not found" });
        }

        // ✅ Check if mentor is approved in MentorRequest
        const mentorRequest = await MentorRequest.findOne({ mentorId, status: "approved" });
        if (!mentorRequest) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign a mentor who is not approved"
            });
        }

        // ✅ Check if mentor has the requested course
        const isCourseAvailable = mentor.courses.some(
            (c) => c.courseName.trim() === studentRequest.stack.trim()
        );

        if (!isCourseAvailable) {
            return res.status(400).json({
                success: false,
                message: "Mentor course does not match student selected course"
            });
        }

        // ✅ Assign mentor
        studentRequest.assignedMentor = mentor._id;
        await studentRequest.save();

        res.status(200).json({ success: true, request: studentRequest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get assigned requests (Mentor side)
export const getAssignedRequests = async (req, res) => {
    try {
        const mentorId = req.user.id;

        const requests = await StudentRequest.find({ assignedMentor: mentorId })
            .populate("student", "name email")
            .populate("assignedMentor", "fullName")
            .populate("replies.mentor", "fullName");

        res.json({ requests });
    } catch (err) {
        console.error("Error fetching assigned requests:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reply to request (Mentor side)
export const replyToRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const mentorId = req.user.id;

        const request = await StudentRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.assignedMentor.toString() !== mentorId) {
            return res.status(403).json({ message: "Not authorized to reply to this request" });
        }

        request.replies.push({
            mentor: mentorId,
            text,
            time: new Date(),
        });

        await request.save();

        res.json({ message: "Reply added", request });
    } catch (err) {
        console.error("Error replying to request:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Mark request as resolved (Mentor side)
export const markRequestResolved = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.user.id;

        const request = await StudentRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.assignedMentor.toString() !== mentorId) {
            return res.status(403).json({ message: "Not authorized to update this request" });
        }

        request.status = "resolved";
        await request.save();

        res.json({ message: "Request marked as resolved", request });
    } catch (err) {
        console.error("Error marking request resolved:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
