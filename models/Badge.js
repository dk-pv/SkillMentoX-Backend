import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String },
    iconName: { type: String },
    earned: { type: Boolean, default: false },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Badge", badgeSchema);
