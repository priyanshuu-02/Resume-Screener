import { Navigate, useLocation } from "react-router-dom";

/**
 * Wraps a route so only logged-in users can access it.
 * Stores the attempted URL so we can redirect back after login.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("authToken");

  if (!token) {
    // Redirect to /auth, saving where they were trying to go
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
