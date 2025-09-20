import mongoose from "mongoose";

const studentRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,

            enum: ["pending", "approved"],

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
        replies: [{
            mentor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Mentor",
                required: true,
            },
            text: {
                type: String,
                required: true,
                trim: true,
            },
            time: {
                type: Date,
                default: Date.now,
            },
        }],
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
