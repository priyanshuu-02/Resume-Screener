import { Router } from "express";
import mongoose from "mongoose";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import { screenResumesForJob, getResultsForJob } from "../../services/screeningService.js";

const router = Router();
const isValidId = (id) => mongoose.isValidObjectId(id);

router.use(optionalAuth);

// POST /api/screen — trigger LLM screening for a job
router.post("/", async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "jobId is required." });
    if (!isValidId(jobId)) return res.status(400).json({ error: "Invalid jobId." });

    const results = await screenResumesForJob(jobId, req.userId);

    res.json({
      jobId,
      totalCandidates: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/screen/results/:jobId — fetch already-screened results for a job
router.get("/results/:jobId", async (req, res) => {
  try {
    if (!isValidId(req.params.jobId)) return res.status(400).json({ error: "Invalid jobId." });
    const results = await getResultsForJob(req.params.jobId, req.userId);
    res.json({
      jobId: req.params.jobId,
      totalCandidates: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
