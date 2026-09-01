"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  role: "candidate" | "issuer_staff" | "platform_admin";
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // CRITICAL SECURITY REQUIREMENT:
  // Access token is strictly kept in memory (React state) — NEVER in localStorage or sessionStorage.
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silently re-establish session using httpOnly refresh token cookie on mount
  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends httpOnly refreshToken cookie
      });

      if (!res.ok) {
        setUser(null);
        setAccessToken(null);
        return null;
      }

      const data = await res.json();
      if (data.accessToken && data.user) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        return data.accessToken as string;
      }
      return null;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    refreshSession().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      // Auto login after registration
      return await login(email, password);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  // API fetch wrapper with automatic in-memory token injection & transparent refresh on 401
  const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    const headers = new Headers(options.headers || {});

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // If 401 Unauthorized, attempt a transparent refresh and retry once
    if (response.status === 401) {
      const newAccessToken = await refreshSession();
      if (newAccessToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: "include",
        });
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
