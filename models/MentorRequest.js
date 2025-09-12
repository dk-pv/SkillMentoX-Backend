import mongoose from "mongoose";

const mentorRequestSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    action: { type: String, enum: ["create", "update"], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "Get Ready for Interview"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }, // soft delete flag
  },
  { timestamps: true }
);

const MentorRequest =
  mongoose.models.MentorRequest ||
  mongoose.model("MentorRequest", mentorRequestSchema);

export default MentorRequest;
