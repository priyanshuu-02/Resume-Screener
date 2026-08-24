/**
 * ScoreDisplay
 *
 * Animated circular score with counting animation.
 * The score counts up from 0 to the target value.
 */

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const SCORE_LABELS = {
  excellent: { label: "Excellent Match", color: "#5EEAD4" },
  good:      { label: "Good Match",      color: "#5EEAD4" },
  fair:      { label: "Fair Match",      color: "#F59E0B" },
  weak:      { label: "Weak Match",      color: "#FF8A73" },
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function ScoreDisplay({ score = 0, label, size = "lg", showLabel = true }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const duration = prefersReduced ? 0 : 1400;
  const circumference = 2 * Math.PI * (size === "lg" ? 54 : 36);
  const radius = size === "lg" ? 54 : 36;
  const svgSize = size === "lg" ? 128 : 88;
  const fontSize = size === "lg" ? 28 : 18;

  const scoreConfig = SCORE_LABELS[label?.toLowerCase()] || SCORE_LABELS.good;
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  useEffect(() => {
    if (!score) return;
    startRef.current = performance.now();
    setRevealed(true);

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (prefersReduced) {
      setDisplayScore(score);
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, duration, prefersReduced]);

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Circular ring */}
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(94,234,212,0.1)"
            strokeWidth={size === "lg" ? 5 : 4}
          />
          {/* Progress arc */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={scoreConfig.color}
            strokeWidth={size === "lg" ? 5 : 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: prefersReduced ? 0 : 1.4, ease: "easeOut" }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold leading-none"
            style={{ fontSize, color: scoreConfig.color, letterSpacing: "-0.03em" }}
          >
            {displayScore}
          </span>
          <span className="font-mono" style={{ fontSize: size === "lg" ? 11 : 9, color: "var(--mist)" }}>
            /100
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className="font-display font-semibold text-sm" style={{ color: scoreConfig.color }}>
            {scoreConfig.label}
          </p>
          {label && (
            <p className="font-mono text-xs mt-0.5" style={{ color: "var(--mist)" }}>
              {label.toUpperCase()}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
