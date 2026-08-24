import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { uploadResumes, createJob, screenJob, uploadAndAnalyze } from "../api/client.js";
import {
  UploadCloud, FileText, X, Loader2, CheckCircle,
  Sparkles, ChevronRight, AlertCircle, Zap
} from "lucide-react";

// ── Mode selector ─────────────────────────────────────────────
const MODES = [
  {
    id: "single",
    label: "Resume Intelligence",
    sublabel: "Deep analysis of one resume",
    icon: Sparkles,
    description: "Upload a single resume and get an interactive AI-powered analysis with highlighted sections, keyword recommendations, and actionable improvement suggestions.",
  },
  {
    id: "bulk",
    label: "Bulk Screening",
    sublabel: "Score multiple candidates",
    icon: Zap,
    description: "Upload multiple resumes and rank all candidates against a job description. Best for hiring teams screening large applicant pools.",
  },
];

// ── Step indicator ────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i <= current ? "var(--signal)" : "var(--line)",
          }} />
      ))}
    </div>
  );
}

// ── Status display ────────────────────────────────────────────
const STATUS_MESSAGES = {
  uploading: "Uploading resume...",
  extracting: "Extracting text with OCR...",
  parsing: "Structuring resume data...",
  analyzing: "Running Gemini AI analysis...",
  screening: "Screening candidates with Gemini AI...",
  done: "Analysis complete.",
  error: "Something went wrong.",
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("single");
  const [files, setFiles] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const newFiles = accepted.filter((f) => !existing.has(f.name));
      // Single mode: replace rather than append
      if (mode === "single") return newFiles.slice(0, 1);
      return [...prev, ...newFiles];
    });
    setErrorMsg("");
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: mode === "bulk",
  });

  const removeFile = (name) => setFiles((f) => f.filter((x) => x.name !== name));

  const handleSingleAnalysis = async () => {
    if (!files[0]) return setErrorMsg("Please upload a resume file.");
    if (!jobDescription.trim()) return setErrorMsg("Please enter a job description.");
    setErrorMsg("");

    try {
      setStatus("uploading");
      setProgress(20);

      const res = await uploadAndAnalyze(
        files[0],
        jobTitle.trim() || "Untitled Position",
        jobDescription.trim(),
        (e) => {
          if (e.lengthComputable) {
            setProgress(20 + Math.round((e.loaded / e.total) * 30));
          }
        }
      );

      setProgress(80);
      setStatus("analyzing");

      await new Promise((r) => setTimeout(r, 400)); // brief pause for UX
      setProgress(100);
      setStatus("done");

      const { screeningId } = res.data;
      if (screeningId) {
        setTimeout(() => navigate(`/analysis/${screeningId}`), 600);
      } else {
        setErrorMsg("Analysis completed but no screening ID was returned.");
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleBulkScreening = async () => {
    if (!files.length) return setErrorMsg("Please upload at least one resume.");
    if (!jobTitle.trim()) return setErrorMsg("Please enter a job title.");
    if (!jobDescription.trim()) return setErrorMsg("Please enter a job description.");
    setErrorMsg("");

    try {
      setStatus("uploading");
      setProgress(25);
      const formData = new FormData();
      files.forEach((f) => formData.append("resumes", f));
      await uploadResumes(formData);

      setProgress(50);
      const jobRes = await createJob(jobTitle.trim(), jobDescription.trim());
      const jobId = jobRes.data._id;

      setStatus("screening");
      setProgress(75);
      await screenJob(jobId);

      setProgress(100);
      setStatus("done");
      setTimeout(() => navigate(`/results/${jobId}`), 600);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleSubmit = () => {
    if (mode === "single") handleSingleAnalysis();
    else handleBulkScreening();
  };

  const isLoading = ["uploading", "extracting", "parsing", "analyzing", "screening"].includes(status);
  const isDone = status === "done";

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--signal)" }}>
          Resume Intelligence
        </span>
        <h1 className="font-display text-3xl font-bold mt-2" style={{ color: "var(--paper)", letterSpacing: "-0.025em" }}>
          Upload & Analyze
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--mist)" }}>
          Upload a resume, paste a job description, and get an interactive AI-powered analysis.
        </p>
      </motion.div>

      {/* Mode selector */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {MODES.map(({ id, label, sublabel, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              onClick={() => { setMode(id); setFiles([]); setErrorMsg(""); }}
              className="p-4 rounded-xl text-left transition-all duration-200 border"
              style={{
                background: active ? "rgba(94,234,212,0.06)" : "var(--void-2)",
                borderColor: active ? "rgba(94,234,212,0.4)" : "var(--line)",
                transform: active ? "none" : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: active ? "var(--signal)" : "var(--mist)" }} />
                <span className="font-medium text-sm" style={{ color: active ? "var(--paper)" : "var(--mist)" }}>
                  {label}
                </span>
              </div>
              <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>{sublabel}</p>
            </button>
          );
        })}
      </motion.div>

      {/* Mode description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={mode}
          className="text-sm px-4 py-3 rounded-lg border"
          style={{ color: "var(--mist)", background: "var(--void-2)", borderColor: "var(--line)" }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {MODES.find((m) => m.id === mode)?.description}
        </motion.p>
      </AnimatePresence>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className="relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200"
          style={{
            borderColor: isDragActive ? "var(--signal)" : "var(--line)",
            background: isDragActive ? "rgba(94,234,212,0.04)" : "var(--void-2)",
          }}
        >
          <input {...getInputProps()} />
          <UploadCloud size={36} className="mx-auto mb-3"
            style={{ color: isDragActive ? "var(--signal)" : "var(--mist)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--paper)" }}>
            {isDragActive ? "Drop to analyze" : mode === "single" ? "Drop resume here" : "Drop resumes here"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--mist)" }}>
            PDF, DOCX, or TXT · up to {mode === "single" ? "1 file" : "20 files"} · 10 MB each
          </p>
          {mode === "single" && (
            <p className="font-mono text-xs mt-3" style={{ color: "var(--signal)" }}>
              Image-based PDFs are supported via OCR
            </p>
          )}
        </div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.ul
              className="mt-3 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {files.map((f) => (
                <motion.li
                  key={f.name}
                  className="flex items-center justify-between rounded-lg px-4 py-2.5 border"
                  style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--paper)" }}>
                    <FileText size={14} style={{ color: "var(--signal)" }} />
                    <span className="truncate max-w-xs">{f.name}</span>
                    <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(f.name)}
                    className="p-1 rounded transition-colors hover:opacity-80"
                    style={{ color: "var(--mist)" }}
                  >
                    <X size={14} />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Job description form */}
      <motion.div
        className="space-y-3 rounded-xl border p-6"
        style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h2 className="font-display font-semibold text-sm" style={{ color: "var(--paper)" }}>
          Job Description
        </h2>

        <input
          type="text"
          placeholder="Job title  (e.g. Senior Frontend Engineer)"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full rounded-lg px-4 py-2.5 text-sm border transition-colors focus:outline-none"
          style={{
            background: "var(--void)",
            borderColor: "var(--line)",
            color: "var(--paper)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
        />

        <textarea
          placeholder="Paste the full job description here..."
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full rounded-lg px-4 py-2.5 text-sm border transition-colors focus:outline-none resize-none"
          style={{
            background: "var(--void)",
            borderColor: "var(--line)",
            color: "var(--paper)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
        />
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg border"
            style={{ color: "var(--reject)", background: "rgba(255,138,115,0.06)", borderColor: "rgba(255,138,115,0.25)" }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle size={14} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--mist)" }}>
              <span>{STATUS_MESSAGES[status] || "Processing..."}</span>
              <span style={{ color: "var(--signal)" }}>{progress}%</span>
            </div>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--signal)" }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isLoading || isDone}
        className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all duration-200"
        style={{
          background: isDone ? "rgba(94,234,212,0.15)" : isLoading ? "rgba(94,234,212,0.3)" : "var(--signal)",
          color: isDone || isLoading ? "var(--signal)" : "var(--ink)",
          cursor: isLoading || isDone ? "not-allowed" : "pointer",
        }}
        whileHover={!isLoading && !isDone ? { scale: 1.01, y: -1 } : {}}
        whileTap={!isLoading && !isDone ? { scale: 0.99 } : {}}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isDone && <CheckCircle size={16} />}
        {!isLoading && !isDone && (mode === "single" ? <Sparkles size={16} /> : <Zap size={16} />)}

        <span>
          {isLoading ? STATUS_MESSAGES[status] || "Processing..." :
           isDone    ? "Done! Redirecting..." :
           mode === "single" ? "Analyze with Gemini AI" : "Screen Candidates"}
        </span>

        {!isLoading && !isDone && <ChevronRight size={16} />}
      </motion.button>
    </div>
  );
}
