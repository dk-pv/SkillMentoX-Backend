import StudentRequest from "../models/studentRequest.js";
import User from "../models/User.js";

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
            error: err.message,   // 👈 show error in response
        });
    }
};

// Get requests (Admin side)
export const getAllRequests = async (req, res) => {
    try {
        const requests = await StudentRequest.find()
            .populate("student", "name email")
            .populate("assignedMentor", "name expertise");

        res.json({ requests });
    } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get my requests (Student side)
export const getMyRequests = async (req, res) => {
    try {
        const studentId = req.user.id;

        const requests = await StudentRequest.find({ student: studentId })
            .populate("assignedMentor", "name expertise");

        res.json({ requests });
    } catch (err) {
        console.error("Error fetching student requests:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Update request (Admin accepts + assigns mentor)
export const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, mentorId, notes } = req.body;

        const request = await StudentRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = status || request.status;
        if (mentorId) request.assignedMentor = mentorId;
        if (notes) request.notes = notes;

        await request.save();

        res.json({ message: "Request updated", request });
    } catch (err) {
        console.error("Error updating request:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};
