import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        subtitle: { type: String },
        time: { type: String },
        color: { type: String },
        iconName: { type: String },
        urgent: { type: Boolean, default: false },
        date: { type: Date, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
