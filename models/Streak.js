import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentStreak: { type: Number, default: 0 },
    days: {
        type: [Boolean],
        default: [false, false, false, false, false, false, false]
    }
}, { timestamps: true });

export default mongoose.model("Streak", streakSchema);
