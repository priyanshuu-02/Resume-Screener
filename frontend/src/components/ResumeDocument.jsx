/**
 * ResumeDocument
 *
 * Renders a resume styled after Priyanshu's template:
 *   - Single-column layout
 *   - Name centred at top, contact strip below
 *   - Sections: Education → Work Experience → Projects → Skills → Awards & Achievements
 *   - Clean ruled section dividers
 *   - Tinos-style serif typography (we use 'Tinos' from Google Fonts, fallback Georgia)
 *   - Highlight system (green/amber/red) for AI recommendations
 *   - isApplied prop on HighlightSpan turns it green once a change is accepted
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Utility: find recommendations matching a specific location
// ─────────────────────────────────────────────────────────────────────────────
function findRecsForLocation(recommendations, section, itemIndex, bulletIndex) {
  if (!recommendations) return [];
  return recommendations.filter((rec) => {
    const loc = rec.locationHint;
    if (!loc) return false;
    if (loc.section !== section) return false;

    if (itemIndex !== undefined) {
      if (loc.itemIndex !== null && loc.itemIndex !== undefined && loc.itemIndex !== itemIndex) return false;
    }

    if (bulletIndex !== undefined) {
      const locBullet = loc.bulletIndex != null ? loc.bulletIndex : undefined;
      if (locBullet !== bulletIndex) return false;
    } else {
      if (loc.bulletIndex !== null && loc.bulletIndex !== undefined) return false;
    }

    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HighlightSpan — wraps text with colour-coded AI suggestion highlight
// ─────────────────────────────────────────────────────────────────────────────
function HighlightSpan({ priority, isApplied, children, onClick, recs }) {
  const [hovered, setHovered] = useState(false);

  const cls = isApplied
    ? "highlight-strong"
    : priority === "high"   ? "highlight-weak"
    : priority === "medium" ? "highlight-improve"
    : "highlight-strong";

  return (
    <span
      className={`relative inline ${cls}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isApplied ? undefined : onClick}
      style={{ cursor: isApplied ? "default" : "pointer" }}
    >
      {children}
      <AnimatePresence>
        {hovered && !isApplied && recs?.length > 0 && (
          <motion.span
            className="tooltip-in absolute left-0 bottom-full mb-1.5 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
          >
            <span
              className="block text-xs py-1.5 px-2.5 rounded whitespace-nowrap font-mono"
              style={{
                background: "var(--void-2)",
                border: "1px solid var(--line)",
                color: "var(--signal)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {recs[0].type?.replace(/_/g, " ") || "AI suggestion"} · click to view
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Divider — ruled line matching the template style
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeading({ label }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <p style={{
        fontFamily: "'Tinos', Georgia, serif",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "#0f1520",
        marginBottom: 2,
      }}>
        {label}
      </p>
      <div style={{ height: 1.5, background: "#0f1520", borderRadius: 1 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ResumeDocument({
  parsedData,
  analysis,
  appliedSuggestions = {},
  onSectionClick,
  scanning = false,
  scanProgress = 0,
}) {
  const docRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const p = parsedData || {};
  const recs = analysis?.recommendations || [];

  // ── Mouse-tracked 3-D tilt ──────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (prefersReduced || !docRef.current) return;
    const rect = docRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: dy * -2, y: dx * 2.5 });
    });
  }, [prefersReduced]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = docRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove, { passive: true });
    el.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const handleClick = (rec) => { if (onSectionClick) onSectionClick(rec); };

  const getRecsForBullet   = (section, itemIdx, bulletIdx) => findRecsForLocation(recs, section, itemIdx, bulletIdx);
  const getRecsForSection  = (section) => recs.filter((r) =>
    r.locationHint?.section === section &&
    (r.locationHint?.itemIndex === null || r.locationHint?.itemIndex === undefined) &&
    (r.locationHint?.bulletIndex === null || r.locationHint?.bulletIndex === undefined)
  );
  const getRecsForItem     = (section, idx) => findRecsForLocation(recs, section, idx, undefined);

  // Shared text styles (matching the Tinos-based template)
  const body = { fontFamily: "'Tinos', Georgia, serif", fontSize: 11, color: "#1a1a1a", lineHeight: 1.55 };
  const bold = { ...body, fontWeight: 700 };
  const italic = { ...body, fontStyle: "italic" };
  const muted = { ...body, color: "#444" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555" };

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* Load Tinos from Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');`}</style>

      <motion.div
        ref={docRef}
        className="resume-paper relative w-full rounded-sm select-text"
        style={{
          fontFamily: "'Tinos', Georgia, serif",
          rotateX: prefersReduced ? 0 : tilt.x,
          rotateY: prefersReduced ? 0 : tilt.y,
        }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* ── PAPER ───────────────────────────────────────────── */}
        <div style={{ background: "#FEFEFE", color: "#1a1a1a", padding: "32px 40px" }}>

          {/* ── HEADER ─────────────────────────────────────────── */}
          <header style={{ textAlign: "center", marginBottom: 10 }}>
            {/* Score badge top-right */}
            {analysis?.overallScore && !scanning && (
              <motion.div
                className="no-print"
                style={{ position: "absolute", top: 28, right: 28 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div style={{ position: "relative", width: 52, height: 52 }}>
                  <svg viewBox="0 0 56 56" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(94,234,212,0.2)" strokeWidth="3.5" />
                    <circle
                      cx="28" cy="28" r="23" fill="none"
                      stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 23}`}
                      strokeDashoffset={`${2 * Math.PI * 23 * (1 - analysis.overallScore / 100)}`}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 12, color: "#5EEAD4" }}>
                      {analysis.overallScore}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#888", textAlign: "center", marginTop: 2, letterSpacing: "0.08em" }}>MATCH</p>
              </motion.div>
            )}

            <h1 style={{ fontFamily: "'Tinos', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5, color: "#0a0a0a" }}>
              {p.name || "YOUR NAME"}
            </h1>

            {/* Contact row */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", fontSize: 10.5, color: "#333" }}>
              {p.phone    && <span>📞 {p.phone}</span>}
              {p.email    && <span>✉ {p.email}</span>}
              {p.linkedin && <span>🔗 Priyanshu Upadhyay</span>}
              {p.location && <span>📍 {p.location}</span>}
              {p.github   && <span>⌥ {p.github.replace("https://github.com/", "").replace("github.com/", "")}</span>}
              {p.website  && <span>🌐 {p.website}</span>}
            </div>

            {/* Professional title / summary if present OR if AI suggested one */}
            {(() => {
              const summaryRecs = getRecsForSection("summary");
              const hasSummaryRec = summaryRecs.length > 0;
              const appliedSummary = appliedSuggestions["summary"] || summaryRecs.map(r => appliedSuggestions[r.id]).find(Boolean);
              const showSummary = p.summary || appliedSummary || hasSummaryRec;
              
              if (!showSummary) return null;
              
              const summaryText = appliedSummary || p.summary;
              const isApplied = !!appliedSummary;
              
              return (
                <div style={{ marginTop: 8, textAlign: "left" }}>
                  {hasSummaryRec ? (
                    <HighlightSpan
                      priority={summaryRecs[0]?.priority}
                      isApplied={isApplied}
                      recs={summaryRecs}
                      onClick={() => handleClick(summaryRecs[0])}
                    >
                      <p style={{ ...body, color: "#333", fontStyle: "italic" }}>
                        {summaryText || "[Click to add professional summary]"}
                      </p>
                    </HighlightSpan>
                  ) : (
                    <p style={{ ...body, color: "#333", fontStyle: "italic" }}>
                      {summaryText}
                    </p>
                  )}
                </div>
              );
            })()}
          </header>

          {/* ── EDUCATION ────────────────────────────────────────── */}
          {p.education?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Educations" />
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {p.education.map((edu, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={bold}>{edu.institution}</span>
                        {edu.gpa && <span style={{ ...muted, marginLeft: 8 }}>CGPA : {edu.gpa}/10</span>}
                      </div>
                      <span style={muted}>{edu.year}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={italic}>{edu.degree}</span>
                    </div>
                    {edu.details && <p style={muted}>{edu.details}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── WORK EXPERIENCE ──────────────────────────────────── */}
          {p.experience?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Work Experiences" />
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 10 }}>
                {p.experience.map((exp, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={bold}>{exp.title}</span>
                        {exp.company && <span style={{ ...body, color: "#444" }}> | {exp.company}</span>}
                      </div>
                      <span style={muted}>{exp.duration}</span>
                    </div>
                    {exp.location && (
                      <p style={{ ...italic, color: "#555", marginBottom: 2 }}>{exp.location}</p>
                    )}
                    {exp.bullets?.length > 0 && (
                      <ul style={{ paddingLeft: 14, marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        {exp.bullets.map((bullet, bi) => {
                          const bulletRecs  = getRecsForBullet("experience", i, bi);
                          const appliedKey  = `exp_${i}_bullet_${bi}`;
                          const isApplied   = !!appliedSuggestions[appliedKey] || bulletRecs.some(r => !!appliedSuggestions[r.id]);
                          const displayText = appliedSuggestions[appliedKey] || bulletRecs.map(r => appliedSuggestions[r.id]).find(Boolean) || bullet;
                          return (
                            <li key={bi} style={{ ...body, listStyleType: "disc" }}>
                              {bulletRecs.length > 0 ? (
                                <HighlightSpan
                                  priority={bulletRecs[0]?.priority}
                                  isApplied={isApplied}
                                  recs={bulletRecs}
                                  onClick={() => handleClick(bulletRecs[0])}
                                >
                                  {displayText}
                                </HighlightSpan>
                              ) : displayText}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── PROJECTS ─────────────────────────────────────────── */}
          {p.projects?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Projects" />
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 10 }}>
                {p.projects.map((proj, i) => {
                  const projRecs = getRecsForBullet("projects", i, undefined);
                  const appliedKey = `proj_${i}`;
                  const isApplied = !!appliedSuggestions[appliedKey] || projRecs.some(r => !!appliedSuggestions[r.id]);
                  const projText = appliedSuggestions[appliedKey] || projRecs.map(r => appliedSuggestions[r.id]).find(Boolean) || proj.description;

                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div>
                          <span style={bold}>{proj.name}</span>
                          {proj.url && <span style={{ color: "#5EEAD4", marginLeft: 4, fontSize: 11 }}>↗</span>}
                        </div>
                        {proj.technologies?.length > 0 && (
                          <span style={{ ...italic, fontSize: 10, color: "#666" }}>
                            {proj.technologies.slice(0, 4).join(", ")}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        projRecs.length > 0 ? (
                          <HighlightSpan
                            priority={projRecs[0]?.priority}
                            isApplied={isApplied}
                            recs={projRecs}
                            onClick={() => handleClick(projRecs[0])}
                          >
                            <p style={{ ...body, marginTop: 2 }}>{projText}</p>
                          </HighlightSpan>
                        ) : (
                          <p style={{ ...body, marginTop: 2 }}>{projText}</p>
                        )
                      )}
                      {/* Render project bullets if any */}
                      {proj.bullets?.length > 0 && (
                        <ul style={{ paddingLeft: 14, marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                          {proj.bullets.map((b, bi) => {
                            const bRecs      = getRecsForBullet("projects", i, bi);
                            const bAppliedKey = `proj_${i}_bullet_${bi}`;
                            const isBApplied  = !!appliedSuggestions[bAppliedKey] || bRecs.some(r => !!appliedSuggestions[r.id]);
                            const displayText = appliedSuggestions[bAppliedKey] || bRecs.map(r => appliedSuggestions[r.id]).find(Boolean) || b;
                            return (
                              <li key={bi} style={{ ...body, listStyleType: "disc" }}>
                                {bRecs.length > 0 ? (
                                  <HighlightSpan
                                    priority={bRecs[0]?.priority}
                                    isApplied={isBApplied}
                                    recs={bRecs}
                                    onClick={() => handleClick(bRecs[0])}
                                  >
                                    {displayText}
                                  </HighlightSpan>
                                ) : displayText}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── SKILLS ───────────────────────────────────────────── */}
          {p.skills?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Skills" />
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.skills.map((skill, i) => {
                  const isPresent = analysis?.keywordAnalysis?.present?.find(
                    (k) => k.keyword?.toLowerCase() === skill?.toLowerCase()
                  );
                  const isUnder = analysis?.keywordAnalysis?.underrepresented?.find(
                    (k) => k.keyword?.toLowerCase() === skill?.toLowerCase()
                  );
                  return (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Tinos', Georgia, serif",
                        fontSize: 10.5,
                        padding: "2px 8px",
                        borderRadius: 3,
                        border: `1px solid ${isPresent ? "rgba(94,234,212,0.6)" : isUnder ? "rgba(245,158,11,0.5)" : "#ccc"}`,
                        background: isPresent ? "rgba(94,234,212,0.1)" : isUnder ? "rgba(245,158,11,0.08)" : "rgba(0,0,0,0.02)",
                        color: isPresent ? "#5EEAD4" : isUnder ? "#D97706" : "#333",
                      }}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
              {/* Grouped skills view if parsedData has no flat list but has categories */}
              {p.skillCategories && Object.entries(p.skillCategories).map(([cat, skills]) => (
                <div key={cat} style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ ...bold, minWidth: 140, fontSize: 10.5 }}>{cat} :</span>
                  <span style={{ ...body, fontSize: 10.5, color: "#333" }}>{Array.isArray(skills) ? skills.join(", ") : skills}</span>
                </div>
              ))}
            </section>
          )}

          {/* ── AWARDS & ACHIEVEMENTS ─────────────────────────────── */}
          {p.achievements?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Awards & Achievements" />
              <ul style={{ paddingLeft: 14, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {p.achievements.map((ach, i) => (
                  <li key={i} style={{ ...body, listStyleType: "disc" }}>{ach}</li>
                ))}
              </ul>
            </section>
          )}

          {/* ── CERTIFICATIONS (if any) ───────────────────────────── */}
          {p.certifications?.length > 0 && (
            <section style={{ marginBottom: 12 }}>
              <SectionHeading label="Certifications" />
              <ul style={{ paddingLeft: 14, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {p.certifications.map((cert, i) => (
                  <li key={i} style={{ ...body, listStyleType: "disc" }}>{cert}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── AI SCANNING OVERLAY ───────────────────────────────── */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ borderRadius: "inherit", overflow: "hidden" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute left-0 right-0 bottom-0"
                style={{ top: `${scanProgress * 100}%`, background: "rgba(11,14,20,0.4)", transition: "top 0.05s linear" }}
              />
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${scanProgress * 100}%`, height: 2,
                  background: "linear-gradient(90deg, transparent, #5EEAD4, transparent)",
                  boxShadow: "0 0 16px 3px rgba(94,234,212,0.5), 0 0 32px 8px rgba(94,234,212,0.2)",
                  transition: "top 0.05s linear",
                }}
              />
              {[...Array(6)].map((_, pi) => (
                <motion.div
                  key={pi}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ background: "#5EEAD4", left: `${15 + pi * 14}%`, top: `${scanProgress * 100}%`, boxShadow: "0 0 6px rgba(94,234,212,0.8)" }}
                  animate={{ y: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6 + pi * 0.1, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
