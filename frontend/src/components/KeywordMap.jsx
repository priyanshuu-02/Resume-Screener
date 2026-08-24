/**
 * KeywordMap
 *
 * Visual keyword analysis panel showing:
 *   - Present keywords (strong/moderate/weak)
 *   - Underrepresented keywords with suggestions
 *   - Missing keywords with honest disclaimers
 *
 * Clicking a keyword highlights the relevant resume section.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, XCircle, ChevronDown, ChevronRight, Info } from "lucide-react";

const STRENGTH_CONFIG = {
  strong:   { color: "#5EEAD4", bg: "rgba(94,234,212,0.1)",   border: "rgba(94,234,212,0.3)"   },
  moderate: { color: "#5EEAD4", bg: "rgba(94,234,212,0.06)",  border: "rgba(94,234,212,0.2)"   },
  weak:     { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
};

const IMPORTANCE_CONFIG = {
  critical: { color: "#FF8A73", bg: "rgba(255,138,115,0.08)", border: "rgba(255,138,115,0.25)" },
  high:     { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
  medium:   { color: "#8B93A7", bg: "rgba(139,147,167,0.08)", border: "rgba(139,147,167,0.2)"  },
};

function KeywordPill({ keyword, config, onClick, badge, expanded, onToggle, children }) {
  return (
    <div>
      <div
        className="group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150"
        style={{ background: config.bg, borderColor: config.border }}
        onClick={onToggle || onClick}
      >
        <span className="text-sm font-medium flex-1 truncate" style={{ color: config.color }}>
          {keyword}
        </span>
        {badge && (
          <span className="font-mono text-xs" style={{ color: config.color, opacity: 0.7 }}>
            {badge}
          </span>
        )}
        {children && (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={12} style={{ color: config.color, opacity: 0.6 }} />
          </motion.div>
        )}
        {onClick && !children && (
          <ChevronRight size={12} className="opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: config.color }} />
        )}
      </div>
      <AnimatePresence>
        {expanded && children && (
          <motion.div
            className="mt-1 px-3 py-2 rounded-lg border-l-2 ml-2 text-xs leading-relaxed"
            style={{
              color: "var(--mist)",
              borderLeftColor: config.border,
              background: "rgba(17,22,35,0.4)",
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, icon: Icon, count, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        className="w-full flex items-center gap-2 py-2 text-left group"
        onClick={() => setOpen(!open)}
      >
        <Icon size={12} style={{ color }} />
        <span className="font-mono text-xs uppercase tracking-widest font-medium" style={{ color, letterSpacing: "0.1em" }}>
          {title}
        </span>
        <span className="font-mono text-xs ml-1" style={{ color: "var(--mist)" }}>({count})</span>
        <motion.div className="ml-auto" animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} style={{ color: "var(--mist)" }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="space-y-1.5 pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KeywordMap({ keywordAnalysis, onKeywordClick }) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  if (!keywordAnalysis) return null;

  const { present = [], underrepresented = [], missing = [] } = keywordAnalysis;

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {/* Present */}
      {present.length > 0 && (
        <Section title="Present" icon={Check} count={present.length} color="#5EEAD4" defaultOpen={true}>
          {present.map((item, i) => {
            const cfg = STRENGTH_CONFIG[item.strength] || STRENGTH_CONFIG.moderate;
            const key = `present_${i}`;
            return (
              <KeywordPill
                key={i}
                keyword={item.keyword}
                config={cfg}
                badge={item.strength}
                expanded={expandedKeys.has(key)}
                onToggle={() => {
                  toggleExpand(key);
                  onKeywordClick?.(item, "present");
                }}
              >
                {item.evidence && (
                  <span>Found in: {item.evidence}</span>
                )}
              </KeywordPill>
            );
          })}
        </Section>
      )}

      {/* Divider */}
      {present.length > 0 && (underrepresented.length > 0 || missing.length > 0) && (
        <div className="h-px" style={{ background: "var(--line)" }} />
      )}

      {/* Underrepresented */}
      {underrepresented.length > 0 && (
        <Section title="Underrepresented" icon={AlertTriangle} count={underrepresented.length} color="#F59E0B" defaultOpen={true}>
          {underrepresented.map((item, i) => {
            const key = `under_${i}`;
            return (
              <KeywordPill
                key={i}
                keyword={item.keyword}
                config={{ color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" }}
                expanded={expandedKeys.has(key)}
                onToggle={() => {
                  toggleExpand(key);
                  onKeywordClick?.(item, "underrepresented");
                }}
              >
                <div className="space-y-1">
                  {item.evidence && <p>Evidence: "{item.evidence}"</p>}
                  {item.suggestion && <p style={{ color: "#F59E0B" }}>Suggestion: {item.suggestion}</p>}
                </div>
              </KeywordPill>
            );
          })}
        </Section>
      )}

      {/* Missing */}
      {missing.length > 0 && (
        <Section title="Missing" icon={XCircle} count={missing.length} color="#8B93A7">
          {missing.map((item, i) => {
            const cfg = IMPORTANCE_CONFIG[item.importance] || IMPORTANCE_CONFIG.medium;
            const key = `missing_${i}`;
            return (
              <KeywordPill
                key={i}
                keyword={item.keyword}
                config={cfg}
                badge={item.importance}
                expanded={expandedKeys.has(key)}
                onToggle={() => toggleExpand(key)}
              >
                <div className="space-y-1">
                  {item.context && <p>{item.context}</p>}
                  <p className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
                    <Info size={10} />
                    {item.disclaimer || "Only add if you genuinely have this experience."}
                  </p>
                </div>
              </KeywordPill>
            );
          })}
        </Section>
      )}

      {present.length === 0 && underrepresented.length === 0 && missing.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: "var(--mist)" }}>
          No keyword analysis available.
        </p>
      )}
    </div>
  );
}
