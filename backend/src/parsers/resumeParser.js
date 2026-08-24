/**
 * Resume File Parser
 * 
 * Now entirely powered by Unstract LLMWhisperer API.
 * Supports PDF, DOCX, PNG, JPG, JPEG, TIFF, WEBP, TXT.
 */
import path from "path";
import config from "../config.js";

const API_KEY = config.unstractApiKey;
const BASE_URL = "https://llmwhisperer-api.us-central.unstract.com/api/v2";

/**
 * Extract text using LLMWhisperer API
 * @param {string} filename 
 * @param {Buffer} buffer 
 * @returns {Promise<string>} extracted text
 */
export async function extractText(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  
  // Plain text can be returned immediately without API overhead
  if (ext === ".txt") {
    return buffer.toString("utf-8").trim();
  }

  console.log(`[parser] Submitting ${filename} to LLMWhisperer API...`);
  
  // 1. Submit document (sync mode)
  // We use processing_mode=sync which waits up to 200s and returns result if done, or falls back to async.
  const submitRes = await fetch(`${BASE_URL}/whisper?processing_mode=sync&output_mode=layout_preserving&mode=high_quality`, {
    method: "POST",
    headers: {
      "unstract-key": API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`LLMWhisperer submission failed (${submitRes.status}): ${errText}`);
  }

  const data = await submitRes.json();
  
  // If sync mode finished it immediately, it might be in extraction.result_text or result_text
  const syncText = data.result_text || data.extraction?.result_text || data.extracted_text;
  if (syncText) {
    console.log(`[parser] Sync extraction complete for ${filename}.`);
    return syncText.trim();
  }

  // Otherwise, it went into async mode, so we need to poll
  const hash = data.whisper_hash;
  if (!hash) {
    throw new Error("LLMWhisperer did not return a hash or text: " + JSON.stringify(data));
  }

  console.log(`[parser] Document queued. Polling status for hash: ${hash}`);
  
  // 2. Poll for status
  let attempts = 0;
  while (attempts < 60) { // max ~120s of polling
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;
    
    const statusRes = await fetch(`${BASE_URL}/whisper-status?whisper_hash=${hash}`, {
      headers: { "unstract-key": API_KEY },
    });
    
    if (!statusRes.ok) continue; // Ignore transient network errors
    
    const statusData = await statusRes.json();
    
    if (statusData.status === "processed") {
      // 3. Retrieve extracted text
      const retRes = await fetch(`${BASE_URL}/whisper-retrieve?whisper_hash=${hash}`, {
        headers: { "unstract-key": API_KEY },
      });
      const retData = await retRes.json();
      return (retData.result_text || retData.extracted_text || retData.extraction?.result_text || "").trim();
    } else if (statusData.status === "failed" || statusData.status === "error") {
      throw new Error(`LLMWhisperer processing failed: ${JSON.stringify(statusData)}`);
    }
  }

  throw new Error("LLMWhisperer timed out while polling for extraction results.");
}
