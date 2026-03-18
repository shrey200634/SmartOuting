import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

// Decode JWT payload — role is now a claim inside the token
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

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("sos_token");
    const saved = localStorage.getItem("sos_user");
    if (token && saved) {
      try { setUser(JSON.parse(saved)); }
      catch {
        localStorage.removeItem("sos_token");
        localStorage.removeItem("sos_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    // Backend still returns a raw JWT string — unchanged
    const token = await authAPI.login(username, password);
    if (!token || typeof token !== "string") throw new Error("Invalid token received");

    // Extract role directly from JWT claims — no localStorage role-map needed
    const claims = parseJwt(token);
    const role = claims?.role || null;

    const userData = { token, name: username.trim(), role };
    localStorage.setItem("sos_token", token);
    localStorage.setItem("sos_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

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
