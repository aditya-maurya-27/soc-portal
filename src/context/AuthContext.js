import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = async (retry = false) => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/validate", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok && data.user) {
          const { id, username, full_name, role } = data.user;

          localStorage.setItem("user_id", id);
          localStorage.setItem("username", username);
          localStorage.setItem("fullName", full_name);
          localStorage.setItem("role", role);
          localStorage.setItem("isAdmin", role === "admin" ? "true" : "false");

          setIsAuthenticated(true);
          setUser({
            id,
            username,
            fullName: full_name,
            role
          });
        } else {
          if (!retry) return validateToken(true);
          localStorage.clear();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        if (!retry) return validateToken(true);
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("isAdmin", data.role === "admin" ? "true" : "false");

        setIsAuthenticated(true);
        setUser({
          id: data.user_id,
          username: data.username,
          fullName: data.fullName,
          role: data.role
        });

        return true;
      } else {
        console.error("Login failed:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
