import Badge from "../models/Badge.js";

export const getBadgesByStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const badges = await Badge.find({ student: id });
        res.json({ data: badges });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
