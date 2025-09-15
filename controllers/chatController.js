import { chatWithHF } from "../config/huggingface.js";

export const handleChat = async (req, res) => {
    try {
        const { message, messages = [] } = req.body;

        if (!message?.trim() && (!Array.isArray(messages) || messages.length === 0)) {
            return res.status(400).json({ error: "Message or previous messages are required" });
        }

        const chatMessages = [
            {
                role: "system",
                content: "You are SkillMentorX assistant. Talk like a human mentor, be friendly and positive, show empathy.",
            },
            ...messages,
            { role: "user", content: message.trim() },
        ];

        const reply = await chatWithHF(chatMessages);

        return res.status(200).json({ reply });
    } catch (err) {
        console.error("Chat API Error:", err.message);
        return res.status(200).json({
            reply: "I'm having trouble connecting to the AI right now. Please try again!",
        });
    }
};
