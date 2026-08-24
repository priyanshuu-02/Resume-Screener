/**
 * LandingPage — renders the cinematic Three.js landing page in a full-screen iframe.
 *
 * Why iframe?
 *   The landing page is a standalone HTML file that loads Three.js + GSAP directly
 *   from CDN and manages its own scroll, canvas, and animation. Running it inside
 *   the React app's DOM would cause conflicts with React's event system and Tailwind.
 *   An iframe gives it a completely clean environment with zero interference.
 *
 * Routing from the landing page:
 *   Buttons in landing.html navigate to /signup, /login, /signup?intent=upload.
 *   The parent React app catches those routes and renders its own pages.
 */

import { useEffect } from "react";

export default function LandingPage() {
  // When the iframe navigates (user clicks a button), catch it in the parent
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "navigate") {
        window.location.href = e.data.href;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      src="/landing.html"
      title="Lucent — Resume screening that sees clearly"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        zIndex: 0,
      }}
    />
  );
}
