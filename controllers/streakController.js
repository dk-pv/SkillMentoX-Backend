import Streak from "../models/Streak.js";

export const getStreak = async (req, res) => {
    try {
        const studentId = req.params.id;
        let streak = await Streak.findOne({ student: studentId });

        if (!streak) {
            streak = new Streak({
                student: studentId,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
            });
            await streak.save();
        }

        res.json({ data: streak });
    } catch (err) {
        console.error("Error fetching/creating streak:", err);
        res.status(500).json({ error: err.message });
    }
};

export const updateStreak = async (req, res) => {
    try {
        const studentId = req.params.id;
        const updates = req.body;

        const streak = await Streak.findOneAndUpdate(
            { student: studentId },
            updates,
            { new: true, upsert: true } 
        );

        res.json({ message: "Streak updated", data: streak });
    } catch (err) {
        console.error("Error updating streak:", err);
        res.status(500).json({ error: err.message });
    }
};