import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a0a", color: "#ffffff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="dash-loading-spinner" />
          <p style={{ marginTop: "14px", color: "var(--color-text-secondary, #9c9c9c)", fontSize: "0.82rem", fontFamily: "var(--font-mono, monospace)" }}>
            AUTHENTICATING STUDIO SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}