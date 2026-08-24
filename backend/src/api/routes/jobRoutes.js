import { Router } from "express";
import mongoose from "mongoose";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import { createJob, getAllJobs, getJobById, deleteJob } from "../../services/jobService.js";

const router = Router();
const isValidId = (id) => mongoose.isValidObjectId(id);

router.use(optionalAuth);

// POST /api/jobs
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: "Both title and description are required." });
    }
    const job = await createJob(title.trim(), description.trim(), req.userId);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await getAllJobs(req.userId);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid job ID." });
    const job = await getJobById(req.params.id, req.userId);
    if (!job) return res.status(404).json({ error: "Job not found." });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid job ID." });
    const deleted = await deleteJob(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: "Job not found." });
    res.json({ message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
