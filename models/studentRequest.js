import mongoose from "mongoose";

const studentRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted"],
            default: "pending",
        },
        stack: {
            type: String,
            required: true,
            trim: true,
        },
        assignedMentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mentor",
            default: null,
        },
        notes: {
            type: String,
            trim: true,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
            immutable: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

studentRequestSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const StudentRequest = mongoose.model("StudentRequest", studentRequestSchema);

export default StudentRequest;
