import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import config from "../../config.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import { runIntelligenceAnalysis, uploadAndAnalyze } from "../../services/analysisService.js";
import Screening from "../../models/Screening.js";

const router = Router();
const isValidId = (id) => mongoose.isValidObjectId(id);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = "." + file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed."));
    }
  },
});

router.use(optionalAuth);

/**
 * POST /api/analyze/upload
 */
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded." });
    }

    const { jobTitle, jobDescription } = req.body;
    if (!jobDescription?.trim()) {
      return res.status(400).json({ error: "jobDescription is required." });
    }

    const result = await uploadAndAnalyze({
      filename: req.file.originalname,
      buffer: req.file.buffer,
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle?.trim() || "Untitled Position",
      userId: req.userId,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Analysis upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/analyze
 */
router.post("/", async (req, res) => {
  try {
    const { resumeId, jobId, jobDescription } = req.body;

    if (!resumeId) return res.status(400).json({ error: "resumeId is required." });
    if (!isValidId(resumeId)) return res.status(400).json({ error: "Invalid resumeId." });
    if (jobId && !isValidId(jobId)) return res.status(400).json({ error: "Invalid jobId." });

    const result = await runIntelligenceAnalysis({
      resumeId,
      jobId,
      jobDescription,
      userId: req.userId,
    });
    res.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analyze/:screeningId
 */
router.get("/:screeningId", async (req, res) => {
  try {
    if (!isValidId(req.params.screeningId)) {
      return res.status(400).json({ error: "Invalid screeningId." });
    }

    const screening = await Screening.findById(req.params.screeningId)
      .populate("resumeId", "filename parsedData rawText")
      .populate("jobId", "title description");

    if (!screening) {
      return res.status(404).json({ error: "Screening not found." });
    }

    res.json({
      screeningId: screening._id,
      resumeId: screening.resumeId?._id,
      jobId: screening.jobId?._id,
      filename: screening.resumeId?.filename,
      jobTitle: screening.jobId?.title,
      parsedData: screening.resumeId?.parsedData,
      rawText: screening.resumeId?.rawText,
      score: screening.score,
      justification: screening.justification,
      matchingSkills: screening.matchingSkills,
      missingSkills: screening.missingSkills,
      analysis: screening.intelligenceAnalysis,
      screenedAt: screening.createdAt,
    });
  } catch (err) {
    console.error("Get analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
