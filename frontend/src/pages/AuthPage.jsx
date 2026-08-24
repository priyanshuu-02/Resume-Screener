import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const BACKEND_URL = `${import.meta.env.VITE_API_URL || ""}/api/v1/auth`;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // If the user was redirected here from a protected route, go back there after login
  const from = location.state?.from?.pathname || "/upload";
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });

  const showStatus = (message, isError = false) => setStatus({ message, isError });
  const clearStatus = () => setStatus({ message: "", isError: false });

  // Safe response parser — handles empty bodies, HTML error pages, and network errors
  const handleApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned malformed JSON (status ${response.status}). Try again.`);
      }
    } else {
      // Got HTML (e.g. a 502 proxy page) or empty body — surface a useful message
      const text = await response.text().catch(() => "");
      if (!response.ok) {
        throw new Error(
          response.status === 404 ? "API endpoint not found. Check VITE_API_URL in your environment." :
          response.status === 503 ? "Backend is starting up, please try again in a moment." :
          `Server error (${response.status})${text ? ": " + text.slice(0, 120) : "."}`
        );
      }
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Authentication failed (${response.status}).`);
    }
    return data;
  };

  // Google Credential Callback
  const handleGoogleCredentialResponse = async (responsePayload) => {
    setLoading(true);
    showStatus("Authenticating with Google server...");

    try {
      const response = await fetch(`${BACKEND_URL}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: responsePayload.credential }),
      });

      const data = await handleApiResponse(response);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));

      showStatus("✅ Google OAuth Login Successful! Redirecting...");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services SDK
  useEffect(() => {
    const initGoogleSDK = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });

        const btnContainer = document.getElementById("google-signin-btn-container");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: "360",
            text: "continue_with",
            shape: "rectangular",
          });
        }
      }
    };

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSDK;
      document.head.appendChild(script);
    } else {
      initGoogleSDK();
    }
  }, []);

  // Direct Redirect to Official Google OAuth 2.0 Page
  const triggerGoogleOAuthRedirect = () => {
    setLoading(true);
    showStatus("Redirecting to Official Google Authorization page...");

    // Official Google OAuth 2.0 Endpoint
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append("redirect_uri", window.location.origin + "/auth");
    googleAuthUrl.searchParams.append("response_type", "token");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("prompt", "select_account");

    window.location.href = googleAuthUrl.toString();
  };

  // Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.identifier || !loginForm.password) {
      showStatus("Please enter your email/username and password.", true);
      return;
    }

    setLoading(true);
    showStatus("Logging in...");
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await handleApiResponse(response);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      clearStatus();
      navigate(from, { replace: true });
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Register
  const handleRegister = async (e) => {
    e.preventDefault();
    const { fullName, email, password, confirmPassword } = registerForm;

    if (!fullName || !email || !password) {
      showStatus("Please fill in all required fields.", true);
      return;
    }

    if (password !== confirmPassword) {
      showStatus("Passwords do not match.", true);
      return;
    }

    setLoading(true);
    showStatus("Creating your account...");
    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await handleApiResponse(response);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      showStatus("✅ Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1200);
    } catch (error) {
      if (error.message.includes("already exists")) {
        showStatus("An account with this email already exists. Switched to Log In.", false);
        setLoginForm({ identifier: email, password: "" });
        setActiveTab("login");
      } else {
        showStatus(error.message, true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ background: "var(--void)" }}>

      {/* Glow effect */}
      <div className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, var(--signal) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
            style={{ color: "var(--paper)" }}>
            <span>LUCENT</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--signal)" }} />
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--mist)", letterSpacing: "0.12em" }}>
            Google OAuth & Account Auth
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-2xl border backdrop-blur-xl shadow-2xl relative overflow-hidden"
          style={{
            background: "rgba(17,21,30,0.85)",
            borderColor: "var(--line)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Tab Switcher */}
          <div className="flex border-b mb-6" style={{ borderColor: "var(--line)" }}>
            <button
              onClick={() => { setActiveTab("login"); clearStatus(); }}
              className="flex-1 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 flex items-center justify-center gap-2"
              style={{
                color: activeTab === "login" ? "var(--signal)" : "var(--mist)",
                borderColor: activeTab === "login" ? "var(--signal)" : "transparent",
              }}
            >
              <LogIn size={14} /> Log In
            </button>
            <button
              onClick={() => { setActiveTab("register"); clearStatus(); }}
              className="flex-1 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 flex items-center justify-center gap-2"
              style={{
                color: activeTab === "register" ? "var(--signal)" : "var(--mist)",
                borderColor: activeTab === "register" ? "var(--signal)" : "transparent",
              }}
            >
              <UserPlus size={14} /> Create Account
            </button>
          </div>

          {/* Official Google Sign-In Button */}
          <div className="mb-5 flex flex-col items-center gap-2">
            <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]"></div>
            <button
              onClick={triggerGoogleOAuthRedirect}
              className="text-[11px] font-mono hover:underline transition-colors"
              style={{ color: "var(--mist)" }}
            >
              Or click to open Official Google Authorization Page →
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--mist)" }}>or email</span>
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Email or Username</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="text"
                      placeholder="you@example.com"
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 mt-2"
                  style={{ background: "var(--signal)", color: "var(--ink)" }}
                >
                  <LogIn size={16} />
                  <span>{loading ? "Authenticating..." : "Log in"}</span>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleRegister}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs" style={{ color: "var(--mist)" }}>Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--mist)" }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border bg-transparent font-mono outline-none focus:border-teal-400"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 mt-2"
                  style={{ background: "var(--signal)", color: "var(--ink)" }}
                >
                  <Sparkles size={16} />
                  <span>{loading ? "Creating Account..." : "Create Account"}</span>
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Status notification */}
          <AnimatePresence>
            {status.message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl text-xs font-mono flex items-center gap-2"
                style={{
                  background: status.isError ? "rgba(255,138,115,0.1)" : "rgba(94,234,212,0.1)",
                  border: `1px solid ${status.isError ? "rgba(255,138,115,0.3)" : "rgba(94,234,212,0.3)"}`,
                  color: status.isError ? "#FF8A73" : "var(--signal)",
                }}
              >
                {status.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span>{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
