import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, trim: true },
        tag: { type: String, required: true, trim: true },
        status: { type: String, enum: ["Pending", "Answered"], default: "Pending" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Doubt", doubtSchema);