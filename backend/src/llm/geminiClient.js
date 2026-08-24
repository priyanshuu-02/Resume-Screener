/**
 * Gemini LLM Client with Auto API Key Rotation & Quota Fallback
 *
 * Uses the Gemini REST API directly via fetch.
 * Model: gemini-3.6-flash
 */

import config from "../config.js";

const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Track current active key index
let currentKeyIndex = 0;

/**
 * Send a prompt to Gemini with automatic API Key rotation and quota fallback.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.1]
 * @param {number} [opts.maxOutputTokens=8192]
 * @returns {Promise<object>}
 */
export async function generateJSON(prompt, opts = {}) {
  const { temperature = 0.1, maxOutputTokens = 8192 } = opts;
  const apiKeys = config.geminiApiKeys;

  let lastError = null;

  // Try available API keys in sequence starting from current index
  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % apiKeys.length;
    const apiKey = apiKeys[keyIndex];

    try {
      const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const status = response.status;
        const errMsg = err?.error?.message || response.statusText;

        // If rate limited (429) or quota exceeded (403/429), switch key and try next
        if (status === 429 || status === 403 || errMsg.includes("quota") || errMsg.includes("limit")) {
          console.warn(
            `⚠️ Gemini API Key #${keyIndex + 1} reached quota/limit (${status}). Rotating to next key...`
          );
          currentKeyIndex = (keyIndex + 1) % apiKeys.length;
          lastError = new Error(`Key #${keyIndex + 1} quota exceeded: ${errMsg}`);
          continue;
        }

        throw new Error(`Gemini API error ${status}: ${errMsg}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Clean markdown formatting if present
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      if (!cleaned) {
        throw new Error("Gemini returned an empty response.");
      }

      try {
        return JSON.parse(cleaned);
      } catch {
        // Gemini hit token limit — response is truncated mid-JSON.
        // Walk backwards character by character to find the last complete
        // key-value pair, then close any open structures.
        let partial = cleaned;

        // Strip any trailing incomplete string (unclosed quote)
        partial = partial.replace(/"[^"]*$/, "");
        // Strip trailing incomplete key or colon
        partial = partial.replace(/,?\s*"[^"]*$/, "");
        partial = partial.replace(/,?\s*$/, "");

        // Count and close open brackets/braces
        let braces = 0, brackets = 0;
        for (const ch of partial) {
          if      (ch === "{") braces++;
          else if (ch === "}") braces--;
          else if (ch === "[") brackets++;
          else if (ch === "]") brackets--;
        }

        const closed = partial
          + "]".repeat(Math.max(0, brackets))
          + "}".repeat(Math.max(0, braces));

        try {
          const recovered = JSON.parse(closed);
          console.warn("[gemini] Recovered partial JSON — response was truncated. Some fields may be missing.");
          return recovered;
        } catch {
          throw new Error(`Gemini returned invalid JSON (truncated at token limit):\n${cleaned.slice(0, 300)}`);
        }
      }
    } catch (err) {
      lastError = err;
      // If error is not a quota/rate limit error, rethrow unless we have other keys to try
      if (!err.message.includes("quota") && !err.message.includes("limit") && !err.message.includes("429")) {
        if (attempt === apiKeys.length - 1) throw err;
      }
    }
  }

  throw new Error(`All configured Gemini API keys exhausted. Last error: ${lastError?.message}`);
}
