/**
 * MatchVisualization
 *
 * Animated connection diagram showing resume skills ↔ job requirements.
 * Each connection animates in with a staggered delay.
 * Match type determines the connection style.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MATCH_COLORS = {
  exact:    { line: "#5EEAD4", left: "rgba(94,234,212,0.12)",  right: "rgba(94,234,212,0.12)",  lText: "#5EEAD4", rText: "#5EEAD4"  },
  semantic: { line: "#5EEAD4", left: "rgba(94,234,212,0.08)",  right: "rgba(94,234,212,0.08)",  lText: "#5EEAD4", rText: "#5EEAD4"  },
  partial:  { line: "#F59E0B", left: "rgba(245,158,11,0.08)",  right: "rgba(245,158,11,0.08)",  lText: "#F59E0B", rText: "#F59E0B"  },
  missing:  { line: "#FF8A73", left: "rgba(255,138,115,0.04)", right: "rgba(255,138,115,0.06)", lText: "#8B93A7", rText: "#FF8A73"  },
};

export default function MatchVisualization({ matchVisualization, onMatchClick }) {
  const svgRef = useRef(null);
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const [paths, setPaths] = useState([]);
  const [ready, setReady] = useState(false);

  const items = (matchVisualization || []).slice(0, 12); // cap at 12 for visual clarity

  // Compute SVG paths once DOM refs are ready
  useEffect(() => {
    if (!ready || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const computed = items.map((_, i) => {
      const leftEl = leftRefs.current[i];
      const rightEl = rightRefs.current[i];
      if (!leftEl || !rightEl) return null;

      const lRect = leftEl.getBoundingClientRect();
      const rRect = rightEl.getBoundingClientRect();

      const x1 = lRect.right - svgRect.left;
      const y1 = lRect.top + lRect.height / 2 - svgRect.top;
      const x2 = rRect.left - svgRect.left;
      const y2 = rRect.top + rRect.height / 2 - svgRect.top;

      const cx = (x1 + x2) / 2;

      return {
        d: `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`,
        ...items[i],
      };
    });

    setPaths(computed.filter(Boolean));
  }, [ready, items]);

  // Wait a tick for refs to populate
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!items.length) return null;

  return (
    <div className="relative">
      <div className="grid" style={{ gridTemplateColumns: "1fr 40px 1fr", gap: 0 }}>
        {/* Left column — Resume */}
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest mb-3 text-center"
            style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
            Resume
          </p>
          {items.map((item, i) => {
            const cfg = MATCH_COLORS[item.matchType] || MATCH_COLORS.partial;
            return (
              <motion.div
                key={i}
                ref={(el) => { leftRefs.current[i] = el; }}
                className="px-3 py-2 rounded-lg border text-sm text-right cursor-pointer transition-all hover:opacity-80"
                style={{ background: cfg.left, borderColor: cfg.line + "30", color: cfg.lText }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                onClick={() => onMatchClick?.(item)}
              >
                {item.resumeText}
              </motion.div>
            );
          })}
        </div>

        {/* SVG connection lines */}
        <div className="relative">
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full overflow-visible pointer-events-none"
            style={{ height: "100%" }}
          >
            {paths.map((p, i) => {
              const cfg = MATCH_COLORS[p.matchType] || MATCH_COLORS.partial;
              const pathLen = 300;
              return (
                <motion.path
                  key={i}
                  d={p.d}
                  fill="none"
                  stroke={cfg.line}
                  strokeWidth={p.matchType === "missing" ? 1 : 1.5}
                  strokeDasharray={pathLen}
                  style={{ opacity: p.matchType === "missing" ? 0.3 : 0.6 }}
                  initial={{ strokeDashoffset: pathLen }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                />
              );
            })}
          </svg>
        </div>

        {/* Right column — Job Description */}
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest mb-3 text-center"
            style={{ color: "var(--mist)", letterSpacing: "0.1em" }}>
            Job Req.
          </p>
          {items.map((item, i) => {
            const cfg = MATCH_COLORS[item.matchType] || MATCH_COLORS.partial;
            return (
              <motion.div
                key={i}
                ref={(el) => { rightRefs.current[i] = el; }}
                className="px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all hover:opacity-80"
                style={{ background: cfg.right, borderColor: cfg.line + "30", color: cfg.rText }}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                onClick={() => onMatchClick?.(item)}
              >
                {item.jobText}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap"
        style={{ borderColor: "var(--line)" }}>
        {[
          { label: "Exact match",    color: "#5EEAD4" },
          { label: "Partial match",  color: "#F59E0B" },
          { label: "Missing",        color: "#FF8A73" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ background: color }} />
            <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
