import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import StudentRoutes from "./routes/StudentRoutes.js";
import adminRoutes from './routes/adminRoutes.js'

dotenv.config();
const app = express();
connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true })); 


app.use("/api/auth", authRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/students",StudentRoutes)
app.use('/api/admin', adminRoutes)


const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
