import React, { createContext, useContext, useState } from "react";
import { User, Role } from "../types";
import { DEMO_USERS } from "../mockData";

interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (targetUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "citycare_opd_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to restore session from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          return session.user;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to parse stored auth session", e);
    }
    // Start unauthenticated so login page or public pages display first
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          return session.token;
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Save or clear session in localStorage whenever user/token changes
  const saveSession = (newUser: User | null, newToken: string | null) => {
    if (newUser && newToken) {
      const session: AuthSession = {
        token: newToken,
        user: newUser,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = (username: string, password = "pass"): boolean => {
    const key = username.toLowerCase().trim();
    const matched = Object.values(DEMO_USERS).find(
      u =>
        u.user.username?.toLowerCase() === key ||
        u.user.id.toLowerCase() === key ||
        u.user.name.toLowerCase().includes(key)
    );

    if (matched) {
      const generatedToken = `jwt-mock-${matched.user.id}-${btoa(matched.user.name)}-${Date.now()}`;
      setUser(matched.user);
      setToken(generatedToken);
      saveSession(matched.user, generatedToken);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    saveSession(null, null);
  };

  const switchUser = (targetUser: User) => {
    const newToken = `jwt-mock-${targetUser.id}-${btoa(targetUser.name)}-${Date.now()}`;
    setUser(targetUser);
    setToken(newToken);
    saveSession(targetUser, newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
