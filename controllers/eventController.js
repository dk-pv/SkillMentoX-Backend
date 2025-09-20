import Event from "../models/Event.js";

export const getUpcomingEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }).limit(5);
        res.json({ data: events });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
