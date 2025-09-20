import Progress from "../models/Progress.js";

export const getProgress = async (req, res) => {
    try {
        const studentId = req.params.id;
        let progress = await Progress.findOne({ student: studentId });

        if (!progress) {
            progress = new Progress({
                student: studentId,
                completionPercentage: 0,
                level: 1,
                coursesCompleted: 0,
                totalCourses: 0,
                studyDaysThisWeek: 0,
                hoursThisMonth: 0,
                xp: 0,
                xpToNextLevel: 1000,
            });
            await progress.save();
        }

        res.json({ data: progress });
    } catch (err) {
        console.error("Error fetching/creating progress:", err);
        res.status(500).json({ error: err.message });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const studentId = req.params.id;
        const updates = req.body;

        const progress = await Progress.findOneAndUpdate(
            { student: studentId },
            updates,
            { new: true, upsert: true }
        );

        res.json({ message: "Progress updated", data: progress });
    } catch (err) {
        console.error("Error updating progress:", err);
        res.status(500).json({ error: err.message });
    }
};