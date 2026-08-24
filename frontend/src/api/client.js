import axios from "axios";

// In production, VITE_API_URL points to your deployed backend (e.g. Render).
// In dev, falls back to empty string so Vite's proxy handles /api/* → localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 120000, // 2 minutes — OCR + LLM processing
});

// Attach Bearer JWT token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalise all error responses so callers always get a proper Error object
// with a human-readable message — never a raw "Unexpected end of JSON" crash.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Analysis is taking longer than expected (the server may be under load). Please try again — it usually works on the second attempt."));
    }

    if (!error.response) {
      // Network error — no response at all (offline, CORS block, etc.)
      return Promise.reject(new Error("Could not reach the server. Check your internet connection or try again later."));
    }

    const { status, data, headers } = error.response;
    const contentType = headers?.["content-type"] || "";

    // If the server returned JSON, extract its error message
    if (contentType.includes("application/json") && data) {
      const msg = data.error || data.message || data.detail;
      if (msg) return Promise.reject(new Error(msg));
    }

    // Fallback status-code messages
    const statusMessages = {
      400: "Bad request — check your input and try again.",
      401: "Not authorised — please log in again.",
      403: "Access denied.",
      404: "Resource not found. The API endpoint may have changed.",
      409: "Conflict — this record already exists.",
      413: "File is too large.",
      422: "Validation error — check your input.",
      429: "Too many requests — slow down and try again.",
      500: "Internal server error. Try again in a moment.",
      502: "Backend is unavailable (502). It may be starting up — wait 30 s and retry.",
      503: "Service unavailable. The backend may be spinning up — try again shortly.",
      504: "Request timed out waiting for the server.",
    };

    return Promise.reject(new Error(statusMessages[status] || `Request failed (${status}).`));
  }
);

// ── Resumes ──────────────────────────────────────────────────────────────────
export const uploadResumes = (formData) =>
  api.post("/api/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getResumes = () => api.get("/api/resumes");
export const getResume  = (id) => api.get(`/api/resumes/${id}`);
export const deleteResume = (id) => api.delete(`/api/resumes/${id}`);

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const createJob = (title, description) =>
  api.post("/api/jobs", { title, description });

export const getJobs   = () => api.get("/api/jobs");
export const deleteJob = (id) => api.delete(`/api/jobs/${id}`);

// ── Screening ─────────────────────────────────────────────────────────────────
export const screenJob  = (jobId) => api.post("/api/screen", { jobId });
export const getResults = (jobId) => api.get(`/api/screen/results/${jobId}`);

// ── Intelligence Analysis ─────────────────────────────────────────────────────
export const uploadAndAnalyze = (resumeFile, jobTitle, jobDescription, onUploadProgress) => {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobTitle", jobTitle);
  formData.append("jobDescription", jobDescription);
  return api.post("/api/analyze/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
    timeout: 300000, // 5 minutes — OCR + Gemini on slow free-tier servers needs this
  });
};

export const runAnalysis = (resumeId, jobId, jobDescription) =>
  api.post("/api/analyze", { resumeId, jobId, jobDescription });

export const getAnalysis = (screeningId) => api.get(`/api/analyze/${screeningId}`);
