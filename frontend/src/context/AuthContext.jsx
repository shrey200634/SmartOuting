import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session
  useEffect(() => {
    const token = localStorage.getItem("sos_token");
    const savedUser = localStorage.getItem("sos_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("sos_token");
        localStorage.removeItem("sos_user");
      }
    }
    setLoading(false);
  }, []);

  // Login: backend returns raw JWT; role is decoded from JWT claims
  const login = useCallback(async (username, password) => {
    const token = await authAPI.login(username, password);
    if (!token || typeof token !== "string") throw new Error("Invalid token received");

    // Decode role directly from JWT payload — no localStorage role-map needed
    let role = null;
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(atob(base64));
      role = claims?.role || null;
    } catch (_) {}

    const userData = { token, name: username.trim(), role };
    localStorage.setItem("sos_token", token);
    localStorage.setItem("sos_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  // After login, allow manual role set (for RoleSelector fallback)
  const setUserRole = useCallback((role) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, role };
      localStorage.setItem("sos_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const register = useCallback(async (data) => {
    return await authAPI.register(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sos_token");
    localStorage.removeItem("sos_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
