/**
 * ScanningOverlay
 *
 * Full-screen cinematic AI scanning animation shown between upload and analysis view.
 * The resume document fades in and a scan line moves down it while analysis runs.
 * Progress percentage counts up to 100%.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ANALYSIS_STAGES = [
  { progress: 12, label: "Extracting text with OCR" },
  { progress: 28, label: "Structuring resume data" },
  { progress: 44, label: "Analyzing experience section" },
  { progress: 58, label: "Matching skills" },
  { progress: 72, label: "Identifying keywords" },
  { progress: 86, label: "Generating recommendations" },
  { progress: 95, label: "Computing match score" },
  { progress: 100, label: "Analysis complete" },
];

export default function ScanningOverlay({ onComplete, durationMs = 2200 }) {
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("Initializing...");
  const [scanPos, setScanPos] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) {
      setProgress(100);
      setStageLabel("Analysis complete");
      onComplete?.();
      return;
    }

    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 2.5); // ease-out
      const p = Math.round(eased * 100);

      setProgress(p);
      setScanPos(eased);

      // Update stage label
      const stage = ANALYSIS_STAGES.findLast((s) => p >= s.progress);
      if (stage) setStageLabel(stage.label);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => onComplete?.(), 300);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, onComplete, prefersReduced]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "var(--void)" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle grain */}
      <div className="fixed inset-0 pointer-events-none opacity-2"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="w-full max-w-sm px-8 space-y-10">
        {/* Brand */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="font-display font-bold text-lg" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>LUCENT</span>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--signal)" }} />
        </motion.div>

        {/* Mini resume representation */}
        <motion.div
          className="relative mx-auto rounded-sm overflow-hidden"
          style={{
            width: 220,
            height: 300,
            background: "#FAFAF8",
            boxShadow: "0 8px 48px rgba(0,0,0,0.4)",
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Document content placeholders */}
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded" style={{ background: "#d1d5db" }} />
              <div className="h-2 w-20 rounded" style={{ background: "#e5e7eb" }} />
              <div className="h-1.5 w-36 rounded mt-1" style={{ background: "#f3f4f6" }} />
            </div>
            {/* Divider */}
            <div className="h-px" style={{ background: "rgba(94,234,212,0.3)" }} />
            {/* Experience section */}
            <div className="space-y-2">
              <div className="h-1.5 w-14 rounded" style={{ background: "rgba(94,234,212,0.4)" }} />
              <div className="space-y-1 pl-2">
                <div className="h-2 w-24 rounded" style={{ background: "#d1d5db" }} />
                <div className="h-1.5 w-36 rounded" style={{ background: "#e5e7eb" }} />
                <div className="h-1.5 w-32 rounded" style={{ background: "#f3f4f6" }} />
              </div>
              <div className="space-y-1 pl-2">
                <div className="h-2 w-20 rounded" style={{ background: "#d1d5db" }} />
                <div className="h-1.5 w-40 rounded" style={{ background: "#e5e7eb" }} />
                <div className="h-1.5 w-28 rounded" style={{ background: "#f3f4f6" }} />
              </div>
            </div>
            {/* Skills */}
            <div className="h-px" style={{ background: "rgba(94,234,212,0.3)" }} />
            <div className="space-y-2">
              <div className="h-1.5 w-10 rounded" style={{ background: "rgba(94,234,212,0.4)" }} />
              <div className="flex flex-wrap gap-1">
                {[14, 18, 12, 20, 16].map((w, i) => (
                  <div key={i} className="h-4 rounded-full" style={{ width: w * 3, background: "#e5e7eb" }} />
                ))}
              </div>
            </div>
          </div>

          {/* Scan line */}
          {scanPos > 0 && scanPos < 1 && (
            <>
              {/* Dim unreached area */}
              <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{
                  top: `${scanPos * 100}%`,
                  background: "rgba(11,14,20,0.5)",
                }}
              />
              {/* Scan beam */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${scanPos * 100}%`,
                  height: 2,
                  background: "linear-gradient(90deg, transparent, #5EEAD4, transparent)",
                  boxShadow: "0 0 12px 3px rgba(94,234,212,0.6)",
                }}
              />
              {/* Particles along scan line */}
              {[...Array(5)].map((_, pi) => (
                <motion.div
                  key={pi}
                  className="absolute w-0.5 h-0.5 rounded-full pointer-events-none"
                  style={{
                    background: "#5EEAD4",
                    left: `${20 + pi * 15}%`,
                    top: `${scanPos * 100}%`,
                    boxShadow: "0 0 4px rgba(94,234,212,0.8)",
                  }}
                  animate={{ y: [-2, 2, -2], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: pi * 0.1 }}
                />
              ))}
            </>
          )}
        </motion.div>

        {/* Progress */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Stage label */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
              {stageLabel}
            </span>
            <span className="font-mono text-sm font-medium" style={{ color: "var(--signal)" }}>
              {progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--signal)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>

          {/* Block representation */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-sm transition-all duration-200"
                style={{ background: i < progress / 5 ? "var(--signal)" : "var(--line)" }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
