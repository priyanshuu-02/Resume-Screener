import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Screening from "../models/Screening.js";
import { generateJSON } from "../llm/geminiClient.js";
import { buildScoringPrompt } from "../llm/prompts.js";

/**
 * Screen all user-bound resumes in the DB against a given job.
 * - Skips resumes already screened for this job (idempotent)
 * - Returns all results sorted by score descending
 */
export async function screenResumesForJob(jobId, userId = null) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  // Fetch only resumes belonging to the requesting user (or guest)
  const resumeQuery = userId ? { userId } : {};
  const resumes = await Resume.find(resumeQuery);
  if (!resumes.length) throw new Error("No resumes found. Upload resumes first.");

  // Find already-screened resume IDs for this job and user
  const screeningQuery = userId ? { jobId, userId } : { jobId };
  const existing = await Screening.find(screeningQuery).select("resumeId");
  const screenedIds = new Set(existing.map((s) => s.resumeId.toString()));

  // Score only new resumes
  const toScreen = resumes.filter((r) => !screenedIds.has(r._id.toString()));

  await Promise.all(toScreen.map((resume) => scoreResume(resume, job, userId)));

  return getResultsForJob(jobId, userId);
}

async function scoreResume(resume, job, userId = null) {
  const parsedData = resume.parsedData || { rawText: resume.rawText };
  const prompt = buildScoringPrompt(job.description, parsedData);

  let score = 1;
  let justification = "Could not evaluate.";
  let matchingSkills = [];
  let missingSkills = [];

  try {
    const result = await generateJSON(prompt);
    score = Math.min(10, Math.max(1, parseInt(result.score) || 1));
    justification = result.justification || justification;
    matchingSkills = result.matching_skills || [];
    missingSkills = result.missing_skills || [];
  } catch (err) {
    console.error(`Scoring failed for resume ${resume._id}:`, err.message);
  }

  // Upsert screening associated with userId
  await Screening.findOneAndUpdate(
    { resumeId: resume._id, jobId: job._id },
    { score, justification, matchingSkills, missingSkills, userId: userId || resume.userId || null },
    { upsert: true, new: true }
  );
}

export async function getResultsForJob(jobId, userId = null) {
  const query = { jobId };
  if (userId) query.userId = userId;

  const screenings = await Screening.find(query)
    .populate("resumeId", "filename parsedData")
    .sort({ score: -1 });

  return screenings.map((s) => ({
    screeningId: s._id,
    resumeId: s.resumeId?._id,
    filename: s.resumeId?.filename || "Unknown",
    candidateName: s.resumeId?.parsedData?.name || "Unknown",
    score: s.score,
    justification: s.justification,
    matchingSkills: s.matchingSkills,
    missingSkills: s.missingSkills,
    screenedAt: s.createdAt,
  }));
}
