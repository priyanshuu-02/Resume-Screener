import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--void)" }}
    >
      {/* Glow */}
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "var(--signal)" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 text-center px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(94,234,212,0.08)", border: "1px solid rgba(94,234,212,0.2)" }}
        >
          <Compass size={28} style={{ color: "var(--signal)" }} />
        </div>

        {/* Code */}
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: "var(--mist)", letterSpacing: "0.15em" }}
        >
          404 · Page Not Found
        </span>

        {/* Heading */}
        <h1
          className="font-display font-bold text-3xl"
          style={{ color: "var(--paper)", letterSpacing: "-0.03em" }}
        >
          Nothing here.
        </h1>

        {/* Sub */}
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--mist)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--signal)", color: "var(--ink)" }}
          >
            <ArrowLeft size={14} />
            Go home
          </Link>
          <Link
            to="/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: "var(--line)", color: "var(--paper)", background: "transparent" }}
          >
            Upload a resume
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
