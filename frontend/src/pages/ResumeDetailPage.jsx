import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getResume } from "../api/client.js";
import { Loader2, ArrowLeft, User, Briefcase, GraduationCap, Code, FolderOpen, Trophy, Award } from "lucide-react";

export default function ResumeDetailPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    getResume(id)
      .then((r) => setResume(r.data))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center" style={{ color: "var(--mist)" }}>
        <Loader2 size={16} className="animate-spin" />
        <span className="font-mono text-sm">Loading resume...</span>
      </div>
    );
  }

  if (!resume) {
    return <p className="font-mono text-sm text-center py-16" style={{ color: "var(--mist)" }}>Resume not found.</p>;
  }

  const p = resume.parsedData || {};

  const Section = ({ icon: Icon, title, children }) => (
    <motion.section
      className="rounded-xl border p-5 space-y-3"
      style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: "var(--paper)" }}>
        <Icon size={14} style={{ color: "var(--signal)" }} />
        {title}
      </h2>
      {children}
    </motion.section>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <Link to="/results"
        className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--mist)" }}>
        <ArrowLeft size={14} /> Back to results
      </Link>

      {/* Header */}
      <motion.div
        className="rounded-xl border p-6"
        style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(94,234,212,0.1)", border: "1px solid rgba(94,234,212,0.2)" }}>
            <User size={20} style={{ color: "var(--signal)" }} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>
              {p.name || "Unknown Candidate"}
            </h1>
            <p className="font-mono text-xs mt-0.5" style={{ color: "var(--mist)" }}>
              {p.email}{p.phone ? ` · ${p.phone}` : ""}{p.location ? ` · ${p.location}` : ""}
            </p>
            {p.title && <p className="text-sm mt-0.5" style={{ color: "var(--mist)" }}>{p.title}</p>}
          </div>
        </div>
        {p.summary && (
          <p className="mt-4 text-sm leading-relaxed border-t pt-4"
            style={{ color: "var(--mist)", borderColor: "var(--line)" }}>
            {p.summary}
          </p>
        )}
      </motion.div>

      {/* Skills */}
      {p.skills?.length > 0 && (
        <Section icon={Code} title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="font-mono text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(94,234,212,0.08)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.2)" }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {p.experience?.length > 0 && (
        <Section icon={Briefcase} title="Experience">
          <ul className="space-y-3">
            {p.experience.map((e, i) => (
              <li key={i} className="border-l-2 pl-4 space-y-1" style={{ borderColor: "rgba(94,234,212,0.3)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--paper)" }}>{e.title}</p>
                <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>{e.company} · {e.duration}</p>
                {e.bullets?.map((b, bi) => (
                  <p key={bi} className="text-xs leading-relaxed" style={{ color: "var(--mist)" }}>· {b}</p>
                ))}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Education */}
      {p.education?.length > 0 && (
        <Section icon={GraduationCap} title="Education">
          <ul className="space-y-3">
            {p.education.map((e, i) => (
              <li key={i} className="border-l-2 pl-4" style={{ borderColor: "rgba(94,234,212,0.15)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--paper)" }}>{e.degree}</p>
                <p className="font-mono text-xs" style={{ color: "var(--mist)" }}>
                  {e.institution}{e.year ? ` · ${e.year}` : ""}
                </p>
                {e.details && <p className="text-xs mt-1" style={{ color: "var(--mist)" }}>{e.details}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Projects */}
      {p.projects?.length > 0 && (
        <Section icon={FolderOpen} title="Projects">
          <ul className="space-y-3">
            {p.projects.map((proj, i) => (
              <li key={i} className="border-l-2 pl-4 space-y-1" style={{ borderColor: "rgba(94,234,212,0.15)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--paper)" }}>{proj.name}</p>
                {proj.description && <p className="text-xs" style={{ color: "var(--mist)" }}>{proj.description}</p>}
                {proj.bullets?.map((b, bi) => (
                  <p key={bi} className="text-xs leading-relaxed" style={{ color: "var(--mist)" }}>· {b}</p>
                ))}
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t) => (
                      <span key={t} className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(94,234,212,0.06)", color: "var(--signal)", border: "1px solid rgba(94,234,212,0.15)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Awards & Achievements */}
      {p.achievements?.length > 0 && (
        <Section icon={Trophy} title="Awards & Achievements">
          <ul className="space-y-2">
            {p.achievements.map((ach, i) => (
              <li key={i} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "var(--mist)" }}>
                <span style={{ color: "var(--signal)" }}>•</span>
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Certifications */}
      {p.certifications?.length > 0 && (
        <Section icon={Award} title="Certifications">
          <ul className="space-y-2">
            {p.certifications.map((cert, i) => (
              <li key={i} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "var(--mist)" }}>
                <span style={{ color: "var(--signal)" }}>•</span>
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Raw text */}
      <motion.div
        className="rounded-xl border p-5"
        style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="font-mono text-xs transition-colors hover:opacity-80 flex items-center justify-between w-full"
          style={{ color: "var(--mist)" }}
        >
          <span>{showRaw ? "Hide" : "Show"} raw extracted text (LLMWhisperer output)</span>
          <span>{showRaw ? "▲" : "▼"}</span>
        </button>
        {showRaw && (
          <pre className="mt-4 font-mono text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap"
            style={{ color: "var(--mist)", background: "var(--void)", padding: 16, borderRadius: 8, border: "1px solid var(--line)" }}>
            {resume.rawText}
          </pre>
        )}
      </motion.div>
    </div>
  );
}
