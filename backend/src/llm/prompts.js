/**
 * LLM Prompt Templates
 *
 * Three prompts power the pipeline:
 *   1. buildExtractionPrompt   — raw resume text → structured JSON
 *   2. buildScoringPrompt      — structured resume JSON + JD → score & justification
 *   3. buildIntelligencePrompt — structured resume JSON + JD → full intelligence analysis
 *                                 (the new rich analysis for the interactive resume experience)
 */

export function buildExtractionPrompt(rawText) {
  return `
You are a resume parser. Output a single valid JSON object — no markdown, no code fences, no explanation, no extra whitespace.

IMPORTANT: Be as concise as possible. Use short strings. Do not pad or beautify the JSON.
Output the COMPLETE object — do not truncate or stop early.

JSON schema (output exactly this structure):
{"name":null,"email":null,"phone":null,"location":null,"title":null,"linkedin":null,"github":null,"website":null,"summary":null,"experience":[{"title":"","company":"","duration":"","location":null,"bullets":[]}],"education":[{"degree":"","institution":"","year":"","gpa":null,"details":null}],"projects":[{"name":"","description":"","technologies":[],"url":null,"bullets":[]}],"skills":[],"certifications":[],"achievements":[]}

Rules:
- Use [] for empty arrays, null for missing strings — never omit a field.
- Extract experience bullets verbatim but keep them under 120 chars each.
- Flatten all skill categories into the "skills" array.
- Output ONLY the JSON. Nothing else.

Resume Text:
${rawText}
`.trim();
}

export function buildScoringPrompt(jobDescription, parsedResumeJSON) {
  return `
You are an expert technical recruiter. Compare the candidate's resume with the job description
and rate how well the candidate fits the role.

Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

Required JSON shape:
{
  "score": <integer between 1 and 10>,
  "justification": "<2-3 sentences explaining the score>",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"]
}

Scoring guide:
  9-10 → Excellent fit, meets almost all requirements
  7-8  → Good fit, meets most requirements with minor gaps
  5-6  → Partial fit, relevant background but notable gaps
  3-4  → Weak fit, limited alignment with the role
  1-2  → Poor fit, significant mismatch

Job Description:
${jobDescription}

Candidate Resume (structured data):
${JSON.stringify(parsedResumeJSON, null, 2)}
`.trim();
}

/**
 * The full intelligence analysis prompt.
 * Returns a rich structured analysis used by the interactive resume experience.
 *
 * CRITICAL: Gemini must NOT hallucinate skills or encourage resume fraud.
 * Each keyword/skill recommendation must clearly classify whether the skill
 * already exists, is poorly represented, or is genuinely missing.
 */
export function buildIntelligencePrompt(jobDescription, parsedResumeJSON) {
  return `
You are an expert technical recruiter and resume coach. Perform a deep analysis of the candidate's
resume against the job description. Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

CRITICAL RULES:
1. Do NOT recommend adding skills the candidate does not appear to have.
2. Clearly distinguish between: present (already there), underrepresented (there but weakly expressed), and missing.
3. Every recommendation must cite the exact source text from the resume and provide a specific improvement.
4. Be honest — if a skill is genuinely absent, say so and note "only add if you genuinely have this experience."

Return this exact JSON shape:

{
  "overallScore": <integer 0-100>,
  "scoreLabel": "<Excellent|Good|Fair|Weak>",
  "executiveSummary": "<2-3 sentence honest assessment of the candidate's fit>",

  "sectionScores": {
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "projects": <0-100>,
    "presentation": <0-100>
  },

  "strengths": [
    {
      "category": "<Skills|Experience|Education|Projects|Presentation>",
      "text": "<what is strong>",
      "evidence": "<exact quote from resume that demonstrates this strength>"
    }
  ],

  "recommendations": [
    {
      "id": "<unique string id like rec_001>",
      "section": "<experience|skills|education|projects|summary|certifications>",
      "priority": "<high|medium|low>",
      "type": "<improve_wording|add_keywords|quantify_impact|add_context|restructure>",
      "sourceText": "<exact text currently in the resume, or null if it's a new addition>",
      "suggestedText": "<the improved version of that text>",
      "reason": "<specific reason why this change improves alignment with the job description>",
      "keywords": ["keyword1", "keyword2"],
      "locationHint": {
        "section": "<experience|skills|education|projects|summary>",
        "itemIndex": <0-based index of the experience/project/education item, or null>,
        "bulletIndex": <0-based index of the bullet point within the item, or null>
      }
    }
  ],

  "keywordAnalysis": {
    "present": [
      {
        "keyword": "<skill/keyword>",
        "strength": "<strong|moderate|weak>",
        "evidence": "<where in resume this appears>",
        "locationHint": {
          "section": "<section name>",
          "itemIndex": <null or index>,
          "bulletIndex": <null or index>
        }
      }
    ],
    "underrepresented": [
      {
        "keyword": "<skill/keyword>",
        "evidence": "<what exists in the resume that relates to this>",
        "suggestion": "<how to better express it>",
        "locationHint": {
          "section": "<section name>",
          "itemIndex": <null or index>,
          "bulletIndex": <null or index>
        }
      }
    ],
    "missing": [
      {
        "keyword": "<skill/keyword>",
        "importance": "<critical|high|medium>",
        "context": "<why this is relevant to the job description>",
        "disclaimer": "Only add if you genuinely have this experience."
      }
    ]
  },

  "matchVisualization": [
    {
      "resumeText": "<skill or concept from resume>",
      "jobText": "<matching requirement from job description>",
      "matchType": "<exact|semantic|partial|missing>",
      "strength": <0-100>
    }
  ],

  "quickWins": [
    {
      "action": "<specific, short, actionable change>",
      "impact": "<high|medium>",
      "effort": "<low|medium>"
    }
  ]
}

Job Description:
${jobDescription}

Candidate Resume (structured data):
${JSON.stringify(parsedResumeJSON, null, 2)}
`.trim();
}
