import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completionPercentage: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coursesCompleted: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    studyDaysThisWeek: { type: Number, default: 0 },
    hoursThisMonth: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    xpToNextLevel: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model("Progress", progressSchema);
