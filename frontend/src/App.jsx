import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import UploadPage from "./pages/UploadPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ResumeDetailPage from "./pages/ResumeDetailPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { FileText, LayoutDashboard, Zap, LogIn, LogOut, User } from "lucide-react";

// App shell — dark Lucent theme
function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("userProfile");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); }
      catch { setUser(null); }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    setUser(null);
    navigate("/");
  };

  const navLinks = [
    { to: "/upload",  label: "Upload & Screen", icon: FileText,        match: (p) => p === "/upload" },
    { to: "/results", label: "Results",          icon: LayoutDashboard, match: (p) => p.startsWith("/results") },
  ];

  return (
    <div className="lucent-shell grain flex flex-col min-h-screen">
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 flex items-center gap-8 px-6 py-4 border-b"
        style={{ background: "rgba(11,14,20,0.9)", backdropFilter: "blur(16px)", borderColor: "var(--line)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-lg"
          style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}
        >
          LUCENT
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--signal)" }} />
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {navLinks.map(({ to, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all"
                style={{
                  color: active ? "var(--signal)" : "var(--mist)",
                  background: active ? "rgba(94,234,212,0.08)" : "transparent",
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          {user ? (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: "rgba(94,234,212,0.06)", borderColor: "rgba(94,234,212,0.2)", color: "var(--paper)" }}
              >
                <User size={12} style={{ color: "var(--signal)" }} />
                <span>{user.name || user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: "var(--mist)" }}
                title="Log out"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all hover:brightness-110"
              style={{ background: "var(--signal)", color: "var(--ink)" }}
            >
              <LogIn size={13} />
              <span>Login</span>
            </Link>
          )}

          <div
            className="hidden sm:flex items-center gap-1.5 border-l pl-4"
            style={{ borderColor: "var(--line)", color: "var(--mist)" }}
          >
            <Zap size={12} style={{ color: "var(--signal)" }} />
            <span>Gemini AI</span>
          </div>
        </div>
      </nav>

      {/* Page content with entrance animation */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"       element={<LandingPage />} />
      <Route path="/auth"   element={<AuthPage />} />
      <Route path="/login"  element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      {/* Protected app routes — redirect to /auth if not logged in */}
      <Route
        path="/upload"
        element={<ProtectedRoute><AppShell><UploadPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/results"
        element={<ProtectedRoute><AppShell><ResultsPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/results/:jobId"
        element={<ProtectedRoute><AppShell><ResultsPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/resume/:id"
        element={<ProtectedRoute><AppShell><ResumeDetailPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/analysis/:screeningId"
        element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>}
      />

      {/* 404 — catch all unmatched routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
