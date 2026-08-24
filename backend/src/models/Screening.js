import mongoose from "mongoose";

const screeningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    score: { type: Number, required: true, min: 1, max: 10 },
    justification: { type: String, required: true },
    matchingSkills: [String],
    missingSkills: [String],
    intelligenceAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Index screening by resumeId and jobId
screeningSchema.index({ resumeId: 1, jobId: 1 });

export default mongoose.model("Screening", screeningSchema);
