/**
 * AIRecommendationPanel
 *
 * A contextual side panel that slides in from the right when a section is clicked.
 * Shows the AI's recommendation with:
 *   - Current text vs suggested text
 *   - Keywords to incorporate
 *   - Reason for the change
 *   - Apply / Dismiss / Undo buttons
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDown, Sparkles, Check, RotateCcw, Tag, AlertCircle, ChevronRight } from "lucide-react";

const PRIORITY_CONFIG = {
  high:   { label: "High priority",   color: "#FF8A73", bg: "rgba(255,138,115,0.08)", border: "rgba(255,138,115,0.25)" },
  medium: { label: "Medium priority", color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
  low:    { label: "Low priority",    color: "#5EEAD4", bg: "rgba(94,234,212,0.06)",  border: "rgba(94,234,212,0.2)"   },
};

const TYPE_LABELS = {
  improve_wording: "Improve wording",
  add_keywords:    "Add keywords",
  quantify_impact: "Quantify impact",
  add_context:     "Add context",
  restructure:     "Restructure",
};

export default function AIRecommendationPanel({
  recommendation,
  isApplied = false,
  onApply,
  onDismiss,
  onUndo,
  onClose,
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(isApplied);

  // Sync applied state when recommendation OR isApplied changes
  // (panel is reused across different recommendations)
  useEffect(() => {
    setApplied(isApplied);
    setApplying(false);
  }, [recommendation?.id, isApplied]);

  if (!recommendation) return null;

  const pc = PRIORITY_CONFIG[recommendation.priority] || PRIORITY_CONFIG.low;

  const handleApply = async () => {
    setApplying(true);
    await new Promise((r) => setTimeout(r, 500)); // smooth UX delay
    setApplied(true);
    setApplying(false);
    onApply?.(recommendation);
  };

  const handleUndo = () => {
    setApplied(false);
    onUndo?.(recommendation);
  };

  return (
    <motion.div
      className="panel-slide-in flex flex-col h-full"
      style={{
        background: "var(--void-2)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        boxShadow: "0 0 0 1px rgba(38,44,59,0.8), 0 16px 48px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--signal)" }} />
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--signal)", letterSpacing: "0.12em" }}>
            AI Recommendation
          </span>
        </div>
        <button onClick={onClose}
          className="p-1 rounded transition-colors hover:opacity-70"
          style={{ color: "var(--mist)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Location + priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs px-2 py-1 rounded capitalize"
            style={{ background: "rgba(94,234,212,0.08)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.2)" }}>
            {recommendation.section}
          </span>
          {recommendation.locationHint?.itemIndex !== null && recommendation.locationHint?.itemIndex !== undefined && (
            <>
              <ChevronRight size={10} style={{ color: "var(--mist)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                Item {recommendation.locationHint.itemIndex + 1}
              </span>
            </>
          )}
          {recommendation.locationHint?.bulletIndex !== null && recommendation.locationHint?.bulletIndex !== undefined && (
            <>
              <ChevronRight size={10} style={{ color: "var(--mist)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                Bullet {recommendation.locationHint.bulletIndex + 1}
              </span>
            </>
          )}
          <span className="ml-auto font-mono text-xs px-2 py-1 rounded"
            style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
            {pc.label}
          </span>
        </div>

        {/* Type badge */}
        {recommendation.type && (
          <div>
            <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
              {TYPE_LABELS[recommendation.type] || recommendation.type}
            </span>
          </div>
        )}

        {/* Current → Suggested */}
        {recommendation.sourceText ? (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
              Current
            </p>
            <div className="px-3 py-3 rounded-lg border-l-2" style={{
              background: "rgba(255,138,115,0.04)",
              borderLeftColor: "rgba(255,138,115,0.4)",
              borderTop: "1px solid rgba(255,138,115,0.1)",
              borderRight: "1px solid rgba(255,138,115,0.1)",
              borderBottom: "1px solid rgba(255,138,115,0.1)",
            }}>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(237,234,225,0.7)", fontStyle: "italic" }}>
                "{recommendation.sourceText}"
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-lg" style={{
            background: "rgba(94,234,212,0.04)",
            border: "1px solid rgba(94,234,212,0.15)",
          }}>
            <p className="text-xs" style={{ color: "var(--signal)" }}>
              ✨ New addition — this section is currently missing
            </p>
          </div>
        )}

        {recommendation.sourceText && recommendation.suggestedText && (
          <div className="flex items-center justify-center">
            <ArrowDown size={16} style={{ color: "var(--signal)" }} />
          </div>
        )}

        {recommendation.suggestedText && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
              {recommendation.sourceText ? "Suggested" : "Add This"}
            </p>
            <div className="px-3 py-3 rounded-lg border-l-2" style={{
              background: "rgba(94,234,212,0.04)",
              borderLeftColor: "rgba(94,234,212,0.5)",
              borderTop: "1px solid rgba(94,234,212,0.12)",
              borderRight: "1px solid rgba(94,234,212,0.12)",
              borderBottom: "1px solid rgba(94,234,212,0.12)",
            }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--paper)" }}>
                "{recommendation.suggestedText}"
              </p>
            </div>
          </div>
        )}

        {/* Keywords */}
        {recommendation.keywords?.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest flex items-center gap-1.5"
              style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
              <Tag size={10} /> Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.keywords.map((kw, i) => (
                <span key={i} className="font-mono text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(94,234,212,0.1)",
                    border: "1px solid rgba(94,234,212,0.3)",
                    color: "var(--signal)",
                  }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        {recommendation.reason && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
              Why
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--mist)" }}>
              {recommendation.reason}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: "var(--line)" }}>
        {applied ? (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg"
              style={{ background: "rgba(94,234,212,0.08)", border: "1px solid rgba(94,234,212,0.2)" }}>
              <Check size={14} style={{ color: "var(--signal)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--signal)" }}>Applied successfully</span>
            </div>
            <button
              onClick={handleUndo}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg border transition-colors hover:opacity-80"
              style={{ color: "var(--mist)", borderColor: "var(--line)", background: "transparent" }}
            >
              <RotateCcw size={12} /> Undo
            </button>
          </motion.div>
        ) : (
          <>
            <motion.button
              onClick={handleApply}
              disabled={applying || !recommendation.suggestedText}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all"
              style={{
                background: applying ? "rgba(94,234,212,0.3)" : !recommendation.suggestedText ? "rgba(94,234,212,0.1)" : "var(--signal)",
                color: applying || !recommendation.suggestedText ? "var(--signal)" : "var(--ink)",
                cursor: !recommendation.suggestedText ? "not-allowed" : "pointer",
              }}
              whileHover={recommendation.suggestedText && !applying ? { scale: 1.01, y: -1 } : {}}
              whileTap={recommendation.suggestedText && !applying ? { scale: 0.99 } : {}}
            >
              {applying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "var(--signal) transparent var(--signal) transparent" }} />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {recommendation.suggestedText ? "Apply Suggestion" : "No suggestion available"}
                </>
              )}
            </motion.button>

            <button
              onClick={() => onDismiss?.(recommendation)}
              className="w-full py-2 text-sm rounded-lg border transition-colors hover:opacity-70"
              style={{ color: "var(--mist)", borderColor: "var(--line)", background: "transparent" }}
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
