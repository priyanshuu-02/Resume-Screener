/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Lucent design system tokens
        void:   "#0B0E14",
        "void-2": "#111623",
        paper:  "#EDEAE1",
        ink:    "#1B1F2A",
        signal: "#5EEAD4",
        reject: "#FF8A73",
        mist:   "#8B93A7",
        line:   "#262C3B",
        amber:  "#F59E0B",
        // Semantic aliases
        "lucent-bg":      "#0B0E14",
        "lucent-surface": "#111623",
        "lucent-border":  "#262C3B",
        "lucent-text":    "#EDEAE1",
        "lucent-muted":   "#8B93A7",
        "lucent-teal":    "#5EEAD4",
        "lucent-coral":   "#FF8A73",
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["IBM Plex Mono", "Fira Mono", "monospace"],
      },
      boxShadow: {
        "paper":     "0 4px 6px -1px rgba(0,0,0,0.08), 0 20px 40px -8px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.05)",
        "paper-lg":  "0 8px 16px -4px rgba(0,0,0,0.12), 0 32px 64px -12px rgba(0,0,0,0.25), 0 4px 8px -2px rgba(0,0,0,0.08)",
        "panel":     "0 0 0 1px rgba(38,44,59,0.8), 0 8px 32px rgba(0,0,0,0.4)",
        "teal-glow": "0 0 20px rgba(94,234,212,0.25)",
      },
      animation: {
        "scan-line":   "scanLine 2s ease-in-out forwards",
        "count-up":    "none",
        "fade-in-up":  "fadeInUp 0.5s ease forwards",
        "slide-in-r":  "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "shimmer":     "shimmer 1.8s ease-in-out infinite",
        "pulse-ring":  "pulseRing 2s ease-in-out infinite",
        "float":       "float 3s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%":   { transform: "translateY(0%)", opacity: "0" },
          "5%":   { opacity: "1" },
          "95%":  { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseRing: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":      { opacity: "0.8", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
      backgroundImage: {
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        "paper-texture": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23EDEAE1'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23E8E4DA' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
