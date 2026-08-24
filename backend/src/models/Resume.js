import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    filename: { type: String, required: true },
    rawText: { type: String, required: true },
    parsedData: {
      name: String,
      email: String,
      phone: String,
      location: String,
      title: String,
      skills: [String],
      experience: [
        {
          title: String,
          company: String,
          duration: String,
          location: String,
          bullets: [String],
        },
      ],
      education: [
        {
          degree: String,
          institution: String,
          year: String,
          gpa: String,
          details: String,
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          url: String,
          bullets: [String],
        },
      ],
      achievements: [String],
      certifications: [String],
      summary: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
