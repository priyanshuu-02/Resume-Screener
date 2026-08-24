import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import config from "../../config.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import {
  processResume,
  getAllResumes,
  getResumeById,
  deleteResume,
} from "../../services/resumeService.js";

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

// Use optionalAuth for all resume routes
router.use(optionalAuth);

// POST /api/resumes/upload
router.post("/upload", upload.array("resumes", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const results = await Promise.all(
      req.files.map((file) => processResume(file.originalname, file.buffer, req.userId))
    );

    res.status(201).json({
      message: `${results.length} resume(s) uploaded and processed.`,
      resumes: results.map((r) => ({
        id: r._id,
        filename: r.filename,
        candidateName: r.parsedData?.name || null,
        skills: r.parsedData?.skills || [],
        uploadedAt: r.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resumes — list resumes belonging to user (or guest)
router.get("/", async (req, res) => {
  try {
    const resumes = await getAllResumes(req.userId);
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resumes/:id
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid resume ID." });
    const resume = await getResumeById(req.params.id, req.userId);
    if (!resume) return res.status(404).json({ error: "Resume not found." });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/resumes/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid resume ID." });
    const deleted = await deleteResume(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: "Resume not found." });
    res.json({ message: "Resume deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
