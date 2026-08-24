/**
 * Analysis Service
 *
 * Provides the full intelligence analysis for a single resume + job description pair.
 * Powers user-specific interactive resume analysis.
 */

import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Screening from "../models/Screening.js";
import { generateJSON } from "../llm/geminiClient.js";
import { buildIntelligencePrompt, buildExtractionPrompt } from "../llm/prompts.js";
import { extractText } from "../parsers/resumeParser.js";

/**
 * Run the full intelligence analysis for an existing resume + job.
 */
export async function runIntelligenceAnalysis({ resumeId, jobId, jobDescription, userId = null }) {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error(`Resume not found: ${resumeId}`);

  // Resolve job description text
  let jdText = jobDescription || "";
  let job = null;
  if (jobId) {
    job = await Job.findById(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    jdText = job.description;
  }
  if (!jdText) throw new Error("A job description (jobId or jobDescription text) is required.");

  // Return cached intelligence analysis if available
  if (jobId) {
    const existing = await Screening.findOne({ resumeId, jobId });
    if (existing?.intelligenceAnalysis) {
      return {
        resumeId,
        jobId,
        parsedData: resume.parsedData,
        rawText: resume.rawText,
        filename: resume.filename,
        analysis: existing.intelligenceAnalysis,
        cachedAt: existing.updatedAt,
      };
    }
  }

  // Build and run the intelligence prompt
  const parsedData = resume.parsedData || {};
  const prompt = buildIntelligencePrompt(jdText, parsedData);
  let analysis;
  try {
    analysis = await generateJSON(prompt, { maxOutputTokens: 8192 });
  } catch (err) {
    throw new Error(`Intelligence analysis failed: ${err.message}`);
  }

  // Cache the result
  if (jobId) {
    await Screening.findOneAndUpdate(
      { resumeId, jobId },
      { $set: { intelligenceAnalysis: analysis, userId: userId || resume.userId || null } },
      { upsert: true, new: true }
    );
  }

  return {
    resumeId,
    jobId: jobId || null,
    parsedData: resume.parsedData,
    rawText: resume.rawText,
    filename: resume.filename,
    analysis,
  };
}

/**
 * Process an uploaded resume + job description and return a full intelligence analysis.
 */
export async function uploadAndAnalyze({ filename, buffer, jobDescription, jobTitle, userId = null }) {
  // 1. Extract text
  const rawText = await extractText(filename, buffer);
  if (!rawText || rawText.length < 20) {
    throw new Error(`Could not extract text from "${filename}". The file may be empty or unsupported.`);
  }

  // 2. Parse structured resume data with Gemini
  const extractionPrompt = buildExtractionPrompt(rawText);
  let parsedData = null;
  try {
    parsedData = await generateJSON(extractionPrompt, { maxOutputTokens: 8192 });
  } catch (err) {
    console.error("Extraction failed, proceeding with null parsedData:", err.message);
  }

  // 3. Save resume to DB with userId
  const resume = await Resume.create({ userId: userId || null, filename, rawText, parsedData });

  // 4. Save job description with userId
  const job = await Job.create({
    userId: userId || null,
    title: jobTitle?.trim() || "Untitled Position",
    description: jobDescription.trim(),
  });

  // 5. Run intelligence analysis
  let analysis = null;
  let analysisError = null;
  if (parsedData) {
    const intelligencePrompt = buildIntelligencePrompt(job.description, parsedData);
    try {
      analysis = await generateJSON(intelligencePrompt, { maxOutputTokens: 8192 });
    } catch (err) {
      analysisError = err.message;
      console.error("[analysisService] Gemini intelligence analysis failed:", err.message);
    }
  } else {
    analysisError = "Resume text extraction returned no structured data — the file may be empty or unsupported.";
    console.error("[analysisService] parsedData is null, skipping analysis.");
  }

  // 6. Save initial screening record with cached intelligence analysis and userId
  const screening = await Screening.create({
    userId: userId || null,
    resumeId: resume._id,
    jobId: job._id,
    score: analysis?.overallScore ? Math.max(1, Math.min(10, Math.round(analysis.overallScore / 10))) : 7,
    justification: analysis?.summary || "Analysis completed.",
    matchingSkills: analysis?.keywordAnalysis?.presentKeywords?.map((k) => k.keyword) || [],
    missingSkills: analysis?.keywordAnalysis?.missingKeywords?.map((k) => k.keyword) || [],
    intelligenceAnalysis: analysis,
  });

  return {
    screeningId: screening._id,
    resumeId: resume._id,
    jobId: job._id,
    filename: resume.filename,
    jobTitle: job.title,
    parsedData: resume.parsedData,
    rawText: resume.rawText,
    analysis,
    analysisError: analysisError || undefined,
  };
}
