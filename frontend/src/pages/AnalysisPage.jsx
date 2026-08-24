/**
 * AnalysisPage — The "Resume Intelligence" experience.
 *
 * Layout:
 *   - Left: Interactive Resume Document (the visual centrepiece)
 *   - Right: AI Analysis Panel (tabbed: Overview / Keywords / Match / Suggestions)
 *   - Sliding right panel: AIRecommendationPanel when a section is clicked
 *
 * Flow:
 *   1. Load analysis data from API
 *   2. Show ScanningOverlay with animation
 *   3. Reveal the split-panel analysis view
 *   4. User interacts with highlighted resume sections
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAnalysis } from "../api/client.js";
import ResumeDocument from "../components/ResumeDocument.jsx";
import AIRecommendationPanel from "../components/AIRecommendationPanel.jsx";
import ScoreDisplay from "../components/ScoreDisplay.jsx";
import KeywordMap from "../components/KeywordMap.jsx";
import MatchVisualization from "../components/MatchVisualization.jsx";
import ScanningOverlay from "../components/ScanningOverlay.jsx";
import {
  ArrowLeft, Sparkles, Target, Tag, List, Zap,
  Check, TrendingUp, ChevronRight, Download
} from "lucide-react";


// ── PDF Download: unlock overflow and add print-mode class ────────
function printResumePDF(candidateName) {
  const prevTitle = document.title;
  document.title = `${candidateName?.replace(/\s+/g, "_") || "Resume"}_CV`;

  // Add print-mode class to body for additional CSS targeting
  document.body.classList.add("print-mode");

  // The root app wrapper has height:100vh overflow:hidden — unlock it for print
  const shell = document.querySelector(".lucent-shell");
  const body  = document.body;
  const html  = document.documentElement;

  const prevShellStyle  = shell  ? shell.getAttribute("style")  : null;
  const prevBodyOverflow = body.style.overflow;
  const prevHtmlOverflow = html.style.overflow;

  if (shell) shell.style.cssText += "; height: auto !important; overflow: visible !important;";
  body.style.overflow = "visible";
  html.style.overflow = "visible";

  // Small delay to ensure styles are applied before print dialog
  setTimeout(() => {
    window.print();
    
    // Restore after the print dialog closes
    setTimeout(() => {
      document.title = prevTitle;
      document.body.classList.remove("print-mode");
      if (shell) {
        if (prevShellStyle !== null) shell.setAttribute("style", prevShellStyle);
        else shell.removeAttribute("style");
      }
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    }, 500);
  }, 100);
}



// ── Tab system ───────────────────────────────────────────────
const TABS = [
  { id: "overview",     label: "Overview",    icon: Sparkles },
  { id: "suggestions",  label: "Suggestions", icon: List     },
  { id: "keywords",     label: "Keywords",    icon: Tag      },
  { id: "match",        label: "Match",       icon: Target   },
];

// ── Quick section score bars ─────────────────────────────────
function SectionScoreBar({ label, score }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs capitalize" style={{ color: "var(--mist)" }}>{label}</span>
        <span className="font-mono text-xs" style={{ color: score >= 70 ? "var(--signal)" : score >= 50 ? "#F59E0B" : "#FF8A73" }}>
          {score}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: score >= 70 ? "var(--signal)" : score >= 50 ? "#F59E0B" : "#FF8A73",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Strength card ─────────────────────────────────────────────
function StrengthCard({ strength }) {
  return (
    <motion.div
      className="px-4 py-3 rounded-lg border"
      style={{ background: "rgba(94,234,212,0.04)", borderColor: "rgba(94,234,212,0.15)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-2">
        <Check size={12} style={{ color: "var(--signal)", marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--signal)" }}>{strength.category}</p>
          <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--paper)" }}>{strength.text}</p>
          {strength.evidence && (
            <p className="text-xs mt-1 italic" style={{ color: "var(--mist)" }}>"{strength.evidence}"</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Recommendation list item ──────────────────────────────────
function RecListItem({ rec, isApplied, isDismissed, onClick }) {
  const priorityColor =
    rec.priority === "high"   ? "#FF8A73" :
    rec.priority === "medium" ? "#F59E0B" : "var(--signal)";

  if (isDismissed) return null;

  return (
    <motion.button
      className="w-full text-left px-4 py-3 rounded-lg border transition-all hover:opacity-80"
      style={{
        background: isApplied ? "rgba(94,234,212,0.05)" : "var(--void)",
        borderColor: isApplied ? "rgba(94,234,212,0.2)" : "var(--line)",
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isApplied ? (
            <Check size={13} style={{ color: "var(--signal)" }} />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: priorityColor }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono capitalize" style={{ color: priorityColor }}>
              {rec.priority}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--mist)" }}>·</span>
            <span className="text-xs capitalize" style={{ color: "var(--mist)" }}>
              {rec.section}
            </span>
            {isApplied && (
              <span className="text-xs font-mono" style={{ color: "var(--signal)" }}>applied</span>
            )}
          </div>
          <p className="text-sm mt-0.5 leading-snug line-clamp-2" style={{ color: "var(--paper)" }}>
            {rec.reason || rec.type?.replace(/_/g, " ")}
          </p>
        </div>
        <ChevronRight size={12} style={{ color: "var(--mist)", flexShrink: 0, marginTop: 4 }} />
      </div>
    </motion.button>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function AnalysisPage() {
  const { screeningId } = useParams();

  // Data state
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // UI state
  const [scanning, setScanning]   = useState(false);
  const [revealed, setRevealed]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Interaction state
  const [activeRec, setActiveRec]        = useState(null);
  // appliedSuggestions: { [storageKey]: suggestedText }
  const [appliedSuggestions, setApplied] = useState({});
  // recKeyMap: { [rec.id]: storageKey } — needed so undo can find the exact key
  const [recKeyMap, setRecKeyMap]        = useState({});
  const [dismissedRecs, setDismissed]    = useState(new Set());

  const resumeScrollRef = useRef(null);

  // Load analysis data
  useEffect(() => {
    if (!screeningId) return;
    setLoading(true);
    getAnalysis(screeningId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
        // Trigger scan animation
        setScanning(true);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      });
  }, [screeningId]);

  // After scanning, reveal the analysis view
  const handleScanComplete = useCallback(() => {
    setScanning(false);
    setTimeout(() => setRevealed(true), 100);
  }, []);

  // Handle resume section click → open recommendation panel
  const handleSectionClick = useCallback((rec) => {
    setActiveRec(rec);
    // Auto-switch to suggestions tab
    setActiveTab("suggestions");
  }, []);

  // Compute the storage key for a recommendation — single source of truth
  const getStorageKey = useCallback((rec) => {
    const loc = rec.locationHint;
    if (loc?.section === "experience" && loc.itemIndex != null && loc.bulletIndex != null) {
      return `exp_${loc.itemIndex}_bullet_${loc.bulletIndex}`;
    }
    if (loc?.section === "summary") return "summary";
    if (loc?.section === "projects" && loc.itemIndex != null && loc.bulletIndex != null) {
      return `proj_${loc.itemIndex}_bullet_${loc.bulletIndex}`;
    }
    if (loc?.section === "projects" && loc.itemIndex != null) {
      return `proj_${loc.itemIndex}`;
    }
    // Fallback: use the rec's own id so each rec has a unique slot
    return rec.id || `rec_${loc?.section || "unknown"}`;
  }, []);

  // Apply a suggestion to the resume document
  const handleApply = useCallback((rec) => {
    if (!rec.suggestedText) return;
    const key = getStorageKey(rec);
    setApplied((prev) => ({ ...prev, [key]: rec.suggestedText }));
    setRecKeyMap((prev) => ({ ...prev, [rec.id]: key }));
  }, [getStorageKey]);

  // Undo an applied suggestion — uses the stored key so it always matches
  const handleUndo = useCallback((rec) => {
    const key = recKeyMap[rec.id] || getStorageKey(rec);
    setApplied((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setRecKeyMap((prev) => {
      const next = { ...prev };
      delete next[rec.id];
      return next;
    });
  }, [recKeyMap, getStorageKey]);

  // Dismiss a recommendation
  const handleDismiss = useCallback((rec) => {
    setDismissed((prev) => new Set([...prev, rec.id]));
    setActiveRec(null);
  }, []);

  // Download Resume PDF
  const handleDownloadPDF = useCallback(() => {
    const candidateName = data?.parsedData?.name;
    printResumePDF(candidateName);
  }, [data]);



  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--void)" }}>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>LUCENT</span>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
        </div>
        <div className="space-y-2 w-64">
          {[0.4, 0.7, 1].map((opacity, i) => (
            <div key={i} className="shimmer-loading h-3 rounded" style={{ opacity }} />
          ))}
        </div>
        <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>Loading analysis...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--void)" }}>
        <div className="text-center space-y-4 max-w-sm px-8">
          <p className="font-display text-xl font-bold" style={{ color: "var(--paper)" }}>Analysis unavailable</p>
          <p className="text-sm" style={{ color: "var(--mist)" }}>{error}</p>
          <Link to="/upload"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm"
            style={{ background: "var(--signal)", color: "var(--ink)" }}>
            Upload a resume
          </Link>
        </div>
      </div>
    );
  }

  const { parsedData, analysis, filename, jobTitle, rawText } = data || {};
  const recs = analysis?.recommendations || [];
  const activeRecs = recs.filter((r) => !dismissedRecs.has(r.id));
  const appliedCount = Object.keys(recKeyMap).length;
  const analysisHasNoRecs = analysis && recs.length === 0;

  return (
    <>
      {/* ── Scanning Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {scanning && (
          <ScanningOverlay
            key="scan"
            onComplete={handleScanComplete}
            durationMs={2000}
          />
        )}
      </AnimatePresence>

      {/* ── Main Analysis View ────────────────────────────── */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="lucent-shell grain flex flex-col"
            style={{ height: "100vh", overflow: "hidden" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── Top nav ─────────────────────────────────── */}
            <nav className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4 border-b"
              style={{
                background: "rgba(11,14,20,0.92)",
                backdropFilter: "blur(16px)",
                borderColor: "var(--line)",
              }}>
              <Link
                to="/upload"
                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--mist)" }}
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back</span>
              </Link>

              <div className="h-4 w-px" style={{ background: "var(--line)" }} />

              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>
                  LUCENT
                </span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />
              </div>

              <div className="flex items-center gap-2 ml-2">
                <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>Resume Analysis</span>
                {jobTitle && (
                  <>
                    <span style={{ color: "var(--line)" }}>·</span>
                    <span className="font-mono text-xs truncate max-w-48" style={{ color: "var(--mist)" }}>{jobTitle}</span>
                  </>
                )}
              </div>

              <div className="ml-auto flex items-center gap-3">
                {/* Download PDF Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: "rgba(94,234,212,0.15)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.3)" }}
                >
                  <Download size={12} />
                  <span>Download PDF</span>
                </button>
                {/* Applied count badge */}
                {appliedCount > 0 && (
                  <motion.div
                    className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(94,234,212,0.1)",
                      border: "1px solid rgba(94,234,212,0.25)",
                      color: "var(--signal)",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Check size={10} />
                    {appliedCount} applied
                  </motion.div>
                )}

                {/* Score badge in nav */}
                {analysis?.overallScore != null && (
                  <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(94,234,212,0.08)",
                      border: "1px solid rgba(94,234,212,0.2)",
                      color: "var(--signal)",
                    }}>
                    <Zap size={10} />
                    {analysis.overallScore}% match
                  </div>
                )}
              </div>
            </nav>

            {/* ── Body: Resume + Analysis ──────────────────── */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ minHeight: 0 }}>

              {/* ── LEFT: Resume Document ─────────────────── */}
              <div
                id="resume-print-root"
                ref={resumeScrollRef}
                className="overflow-y-auto px-4 py-6 lg:px-10 lg:py-8 lg:flex-shrink-0"
                style={{
                  width: "min(52%, 640px)",
                  minWidth: 280,
                }}
              >
                {/* Mobile: limit height so panel is still visible */}
                <style>{`
                  @media (max-width: 1023px) {
                    .resume-col { max-height: 55vh; }
                  }
                `}</style>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Document header label */}
                  <div className="no-print flex items-center gap-2 mb-4">
                    <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)", letterSpacing: "0.12em" }}>
                      Resume Document
                    </span>
                    {filename && (
                      <span className="font-mono text-xs truncate" style={{ color: "var(--line)" }}>
                        · {filename}
                      </span>
                    )}
                  </div>

                  <ResumeDocument
                    parsedData={parsedData}
                    analysis={analysis}
                    appliedSuggestions={appliedSuggestions}
                    onSectionClick={handleSectionClick}
                    scanning={false}
                  />

                  {/* Highlight legend */}
                  {recs.length > 0 && (
                    <motion.div
                      className="no-print mt-4 flex items-center gap-4 flex-wrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>Highlight key:</span>
                      {[
                        { label: "Strong",  cls: "highlight-strong"  },
                        { label: "Improve", cls: "highlight-improve" },
                        { label: "✓ Applied",  cls: "highlight-strong",  textColor: "#5EEAD4" },
                        { label: "Improve",  cls: "highlight-improve", textColor: "#D97706" },
                        { label: "Weak",     cls: "highlight-weak",    textColor: "#FF8A73" },
                      ].map(({ label, cls, textColor }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded ${cls}`} style={{ color: textColor }}>
                            {label}
                          </span>
                        </div>
                      ))}
                      <span className="font-mono text-xs ml-auto" style={{ color: "var(--mist)" }}>
                        Click highlighted text for AI suggestions
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* ── RIGHT: Analysis Panel ─────────────────── */}
              <div
                className="border-t lg:border-t-0 lg:border-l flex flex-col overflow-hidden flex-1"
                style={{
                  minWidth: 280,
                  borderColor: "var(--line)",
                  transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                {/* Tab bar */}
                <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--line)" }}>
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 relative"
                        style={{
                          color: active ? "var(--signal)" : "var(--mist)",
                          borderBottomColor: active ? "var(--signal)" : "transparent",
                          background: "transparent",
                        }}
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{label}</span>
                        {id === "suggestions" && activeRecs.length > 0 && (
                          <span className="font-mono text-xs ml-1 px-1.5 rounded-full"
                            style={{ background: "rgba(255,138,115,0.15)", color: "#FF8A73", fontSize: 9 }}>
                            {activeRecs.filter((r) => r.priority === "high").length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">

                    {/* ── OVERVIEW TAB ────────────────────── */}
                    {activeTab === "overview" && (
                      <motion.div
                        key="overview"
                        className="p-5 space-y-6"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* No analysis fallback */}
                        {!analysis && (
                          <div className="text-center py-16 space-y-3">
                            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                              style={{ background: "rgba(255,138,115,0.08)", border: "1px solid rgba(255,138,115,0.2)" }}>
                              <Zap size={18} style={{ color: "#FF8A73" }} />
                            </div>
                            <p className="font-display font-semibold" style={{ color: "var(--paper)" }}>
                              AI analysis unavailable
                            </p>
                            <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--mist)" }}>
                              The Gemini analysis did not complete. This usually means the resume had too little text for meaningful extraction, or there was a temporary API issue.
                            </p>
                            <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                              The resume document is still displayed on the left with the raw parsed data.
                            </p>
                          </div>
                        )}

                        {/* Score */}
                        {analysis?.overallScore != null && (
                          <div className="flex justify-center py-4">
                            <ScoreDisplay
                              score={analysis.overallScore}
                              label={analysis.scoreLabel}
                              size="lg"
                            />
                          </div>
                        )}

                        {/* Executive summary */}
                        {analysis?.executiveSummary && (
                          <div className="px-4 py-4 rounded-xl border"
                            style={{ background: "var(--void)", borderColor: "var(--line)" }}>
                            <p className="font-mono text-xs uppercase tracking-widest mb-2"
                              style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>Summary</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--paper)" }}>
                              {analysis.executiveSummary}
                            </p>
                          </div>
                        )}

                        {/* Section scores */}
                        {analysis?.sectionScores && Object.keys(analysis.sectionScores).length > 0 && (
                          <div className="space-y-3">
                            <p className="font-mono text-xs uppercase tracking-widest"
                              style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>Section breakdown</p>
                            {Object.entries(analysis.sectionScores).map(([section, score]) => (
                              <SectionScoreBar key={section} label={section} score={Number(score) || 0} />
                            ))}
                          </div>
                        )}

                        {/* Strengths */}
                        {analysis?.strengths?.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-mono text-xs uppercase tracking-widest"
                              style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>Strengths</p>
                            {analysis.strengths.map((s, i) => (
                              <StrengthCard key={i} strength={s} />
                            ))}
                          </div>
                        )}

                        {/* Quick wins */}
                        {analysis?.quickWins?.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-mono text-xs uppercase tracking-widest"
                              style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>Quick wins</p>
                            {analysis.quickWins.map((qw, i) => (
                              <motion.div
                                key={i}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-lg border"
                                style={{ background: "rgba(94,234,212,0.03)", borderColor: "rgba(94,234,212,0.12)" }}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <TrendingUp size={12} style={{ color: "var(--signal)", marginTop: 2, flexShrink: 0 }} />
                                <div className="flex-1">
                                  <p className="text-sm leading-snug" style={{ color: "var(--paper)" }}>{qw.action}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-xs"
                                      style={{ color: qw.impact === "high" ? "#FF8A73" : "#F59E0B" }}>
                                      {qw.impact} impact
                                    </span>
                                    <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>·</span>
                                    <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                                      {qw.effort} effort
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── SUGGESTIONS TAB ─────────────────── */}
                    {activeTab === "suggestions" && (
                      <motion.div
                        key="suggestions"
                        className="p-5 space-y-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* No analysis at all */}
                        {!analysis && (
                          <div className="text-center py-12 space-y-3">
                            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
                              style={{ background: "rgba(255,138,115,0.1)", border: "1px solid rgba(255,138,115,0.25)" }}>
                              <Zap size={16} style={{ color: "#FF8A73" }} />
                            </div>
                            <p className="font-display font-semibold text-sm" style={{ color: "var(--paper)" }}>
                              Analysis not available
                            </p>
                            <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: "var(--mist)" }}>
                              The AI analysis could not be completed for this resume. This can happen if the resume text was too short or unreadable.
                            </p>
                          </div>
                        )}

                        {/* Analysis exists but no recommendations */}
                        {analysis && recs.length === 0 && (
                          <div className="text-center py-12 space-y-2">
                            <Check size={24} className="mx-auto" style={{ color: "var(--signal)" }} />
                            <p className="text-sm" style={{ color: "var(--mist)" }}>
                              No specific suggestions — the resume is well-aligned with the job.
                            </p>
                          </div>
                        )}

                        {/* All dismissed */}
                        {analysis && recs.length > 0 && activeRecs.length === 0 && (
                          <div className="text-center py-12 space-y-2">
                            <Check size={24} className="mx-auto" style={{ color: "var(--signal)" }} />
                            <p className="text-sm" style={{ color: "var(--mist)" }}>
                              All {recs.length} suggestions applied or dismissed.
                            </p>
                          </div>
                        )}

                        {/* Active recommendations */}
                        {activeRecs.length > 0 && (
                          <>
                            <div className="flex items-center justify-between pb-1">
                              <p className="font-mono text-xs uppercase tracking-widest"
                                style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
                                {activeRecs.length} suggestion{activeRecs.length !== 1 ? "s" : ""}
                              </p>
                              <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                                Click to view · apply · dismiss
                              </p>
                            </div>
                            {["high", "medium", "low"].flatMap((priority) =>
                              activeRecs
                                .filter((r) => r.priority === priority)
                                .map((rec) => (
                                  <RecListItem
                                    key={rec.id}
                                    rec={rec}
                                    isApplied={rec.id in recKeyMap}
                                    isDismissed={false}
                                    onClick={() => setActiveRec(rec)}
                                  />
                                ))
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* ── KEYWORDS TAB ────────────────────── */}
                    {activeTab === "keywords" && (
                      <motion.div
                        key="keywords"
                        className="p-5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <KeywordMap
                          keywordAnalysis={analysis?.keywordAnalysis}
                          onKeywordClick={(item) => {
                            // If there's a location hint, find matching rec and open it
                            if (item.locationHint) {
                              const matchingRec = recs.find((r) =>
                                r.locationHint?.section === item.locationHint.section &&
                                r.locationHint?.itemIndex === item.locationHint.itemIndex
                              );
                              if (matchingRec) setActiveRec(matchingRec);
                            }
                          }}
                        />
                      </motion.div>
                    )}

                    {/* ── MATCH TAB ───────────────────────── */}
                    {activeTab === "match" && (
                      <motion.div
                        key="match"
                        className="p-5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {analysis?.matchVisualization?.length > 0 ? (
                          <MatchVisualization
                            matchVisualization={analysis.matchVisualization}
                            onMatchClick={(item) => {
                              const matching = recs.find((r) =>
                                r.keywords?.some((kw) =>
                                  item.resumeText?.toLowerCase().includes(kw?.toLowerCase()) ||
                                  item.jobText?.toLowerCase().includes(kw?.toLowerCase())
                                )
                              );
                              if (matching) setActiveRec(matching);
                            }}
                          />
                        ) : (
                          <p className="text-sm text-center py-8" style={{ color: "var(--mist)" }}>
                            Match visualization not available for this analysis.
                          </p>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>

              {/* ── FAR RIGHT: Recommendation Detail Panel ── */}
              <AnimatePresence>
                {activeRec && (
                  <motion.div
                    className="border-l flex-shrink-0 overflow-hidden"
                    style={{
                      width: 320,
                      borderColor: "var(--line)",
                    }}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AIRecommendationPanel
                      recommendation={activeRec}
                      isApplied={activeRec.id in recKeyMap}
                      onApply={handleApply}
                      onDismiss={handleDismiss}
                      onUndo={handleUndo}
                      onClose={() => setActiveRec(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* ── Mobile bottom bar (score + link) ────────── */}
            <div className="lg:hidden border-t px-4 py-3 flex items-center gap-4"
              style={{ borderColor: "var(--line)", background: "var(--void-2)" }}>
              {analysis?.overallScore && (
                <div className="flex items-center gap-2">
                  <Zap size={12} style={{ color: "var(--signal)" }} />
                  <span className="font-mono text-sm font-medium" style={{ color: "var(--signal)" }}>
                    {analysis.overallScore}% match
                  </span>
                </div>
              )}
              <span className="text-xs" style={{ color: "var(--mist)" }}>
                {activeRecs.length} suggestions available
              </span>
              <Link to="/upload" className="ml-auto text-xs" style={{ color: "var(--mist)" }}>
                New analysis →
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
