import { useAuth } from "./AuthContext";
import { Navigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import "../styles/ProtectedRoute.css";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
      }}>
        <div className="authenticating-screen">


          <div className="authenticating-upper">
            <KeyRound size={26} />
            <span>Authenticating User...</span>
          </div>


          <div className="authenticating-lower">
            <img src="/logo.png" alt="Logo" className="authenticating-logo-image" />
            <p className="authenticating-logo-text">
              GT CVC
            </p>
          </div>

          
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return children;
}
