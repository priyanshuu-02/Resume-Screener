import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getResults, getJobs } from "../api/client.js";
import { Loader2, ChevronDown, Sparkles, Zap } from "lucide-react";

// Score badge
function ScoreBadge({ score }) {
  const { color, bg, border } =
    score >= 8 ? { color: "var(--signal)", bg: "rgba(94,234,212,0.1)",   border: "rgba(94,234,212,0.3)"   } :
    score >= 6 ? { color: "#F59E0B",       bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.3)"   } :
    score >= 4 ? { color: "#FF8A73",       bg: "rgba(255,138,115,0.1)",  border: "rgba(255,138,115,0.3)"  } :
                 { color: "#FF8A73",       bg: "rgba(255,138,115,0.08)", border: "rgba(255,138,115,0.25)" };

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {score}/10
    </div>
  );
}

// Candidate card
function CandidateCard({ result, index, screeningId }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="rounded-xl border p-5 space-y-3"
      style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sm truncate" style={{ color: "var(--paper)" }}>
            {result.candidateName || "Unknown Candidate"}
          </h3>
          <p className="font-mono text-xs mt-0.5 truncate" style={{ color: "var(--mist)" }}>{result.filename}</p>
        </div>
        <ScoreBadge score={result.score} />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--mist)" }}>{result.justification}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {result.matchingSkills?.slice(0, 6).map((s) => (
          <span key={s} className="font-mono text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(94,234,212,0.08)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.2)" }}>
            {s}
          </span>
        ))}
        {result.missingSkills?.slice(0, 4).map((s) => (
          <span key={s} className="font-mono text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,138,115,0.06)", color: "#FF8A73", border: "1px solid rgba(255,138,115,0.2)" }}>
            missing: {s}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: "var(--mist)" }}
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.div>
          {expanded ? "Hide" : "More"} detail
        </button>

        {/* View Intelligence Analysis button — links to analysis page if screeningId available */}
        {result.screeningId && (
          <Link
            to={`/analysis/${result.screeningId}`}
            className="ml-auto flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
            style={{ background: "rgba(94,234,212,0.08)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.2)" }}
          >
            <Sparkles size={10} />
            View Intelligence
          </Link>
        )}

        {result.resumeId && (
          <Link
            to={`/resume/${result.resumeId}`}
            className="font-mono text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--mist)" }}
          >
            Raw resume →
          </Link>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="pt-2 border-t space-y-1"
            style={{ borderColor: "var(--line)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>
              Screened: {result.screenedAt ? new Date(result.screenedAt).toLocaleDateString() : "—"}
            </p>
            <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>
              Screening ID: {result.screeningId}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResultsPage() {
  const { jobId } = useParams();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(1);

  useEffect(() => {
    getJobs()
      .then((r) => setJobs(r.data))
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    getResults(selectedJobId)
      .then((r) => setResults(r.data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const filtered = results.filter((r) => r.score >= minScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--signal)" }}>
          Screening Results
        </span>
        <h1 className="font-display text-2xl font-bold mt-1" style={{ color: "var(--paper)", letterSpacing: "-0.025em" }}>
          Candidate Rankings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--mist)" }}>Candidates ranked by Gemini AI fit score.</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex flex-wrap gap-4 items-end p-4 rounded-xl border"
        style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)" }}>Job</label>
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border pr-8 focus:outline-none transition-colors"
              style={{
                background: "var(--void)",
                borderColor: "var(--line)",
                color: "var(--paper)",
                minWidth: 240,
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
            >
              <option value="">— select a job —</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--mist)" }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)" }}>
            Min score: <span style={{ color: "var(--signal)" }}>{minScore}</span>
          </label>
          <input
            type="range" min={1} max={10} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-32 accent-signal"
            style={{ accentColor: "var(--signal)" }}
          />
        </div>

        <div className="ml-auto font-mono text-xs" style={{ color: "var(--mist)" }}>
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
        </div>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--mist)" }}>
          <Loader2 size={16} className="animate-spin" />
          <span className="font-mono text-sm">Loading results...</span>
        </div>
      ) : !selectedJobId ? (
        <p className="font-mono text-sm text-center py-12" style={{ color: "var(--mist)" }}>
          Select a job above to view screening results.
        </p>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-sm text-center py-12" style={{ color: "var(--mist)" }}>
          No candidates match the current score filter.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <CandidateCard key={r.screeningId} result={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
