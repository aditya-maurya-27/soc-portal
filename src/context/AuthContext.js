import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // ✅ added user state

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("authToken");
      const user_id = localStorage.getItem("user_id");
      const username = localStorage.getItem("username");

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://192.168.1.49:5000/api/validate", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
          setUser({ id: user_id, username }); // ✅ store user object
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("username");
          localStorage.removeItem("user_id");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
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
      const response = await fetch("http://192.168.1.49:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_id", data.user_id);
        setIsAuthenticated(true);
        setUser({ id: data.user_id, username: data.username }); // ✅ set user info
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
