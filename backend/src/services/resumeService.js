import Resume from "../models/Resume.js";
import { extractText } from "../parsers/resumeParser.js";
import { generateJSON } from "../llm/geminiClient.js";
import { buildExtractionPrompt } from "../llm/prompts.js";

/**
 * Full pipeline for one uploaded file:
 *   raw buffer → extract text → Gemini extraction → save to MongoDB with userId
 */
export async function processResume(filename, buffer, userId = null) {
  // 1. Extract raw text
  const rawText = await extractText(filename, buffer);
  if (!rawText) {
    throw new Error(`No text could be extracted from "${filename}". The file may be empty or image-based.`);
  }

  // 2. Ask Gemini to parse into structured data
  const prompt = buildExtractionPrompt(rawText);
  let parsedData;
  try {
    parsedData = await generateJSON(prompt);
  } catch (err) {
    console.error("LLM extraction failed:", err.message);
    parsedData = null;
  }

  // 3. Save to MongoDB associated with userId
  const resume = await Resume.create({ userId: userId || null, filename, rawText, parsedData });
  return resume;
}

export async function getAllResumes(userId = null) {
  const query = userId ? { userId } : {};
  return Resume.find(query).sort({ createdAt: -1 }).select("-rawText");
}

export async function getResumeById(id, userId = null) {
  const query = { _id: id };
  if (userId) query.userId = userId;
  return Resume.findOne(query);
}

export async function deleteResume(id, userId = null) {
  const query = { _id: id };
  if (userId) query.userId = userId;
  const result = await Resume.findOneAndDelete(query);
  return !!result;
}
