import mongoose from "mongoose";
const courseSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  courseName: { type: String, required: true, trim: true },
 
});

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: { type: String, required: true, trim: true },

    headline: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    currentRole: { type: String, trim: true },
    company: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0 },

    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: String, trim: true },
      },
    ],
    certifications: [{ type: String, trim: true }],
    courses:[courseSchema],

    email: { type: String, required: true, lowercase: true, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      trim: true,
    },
    phoneNumber: { type: String, trim: true },

    documents: {
      idProof: [{ type: String }],
      qualificationProof: [{ type: String }], 
      cv: [{ type: String }], 
     
    },
    status: {
      type: String,
      enum: ["Pending", "approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

export default Mentor;
