"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "student" | "teacher" | "admin";

export interface UserState {
  isLoggedIn: boolean;
  role: UserRole | null;
  year: string; // e.g. "GL3", "MPI", "IIA", etc.
  name: string;
  email: string;
  id: number | null; // Simulated backend user ID
}

interface UserContextType {
  user: UserState;
  login: (role: UserRole, year?: string, name?: string, email?: string, id?: number) => void;
  logout: () => void;
  updateYear: (year: string) => void;
}

const defaultUserState: UserState = {
  isLoggedIn: false,
  role: null,
  year: "GL3",
  name: "",
  email: "",
  id: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);
const USER_STORAGE_KEY = "insat_connect_user";
const TOKEN_STORAGE_KEY = "insat_token";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>(defaultUserState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from sessionStorage on client side (session scoped to tab)
    let stored = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
      // Migrate legacy localStorage state once if present.
      const legacy = localStorage.getItem(USER_STORAGE_KEY);
      if (legacy) {
        sessionStorage.setItem(USER_STORAGE_KEY, legacy);
        localStorage.removeItem(USER_STORAGE_KEY);
        stored = legacy;
      }
    }
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (role: UserRole, year: string = "GL3", name?: string, email?: string, id?: number) => {
    let defaultName = "Étudiant INSAT";
    let defaultEmail = "student@insat.u-cartago.tn";
    let defaultId: number = 2;

    if (role === "teacher") {
      defaultName = name || "Dr. Mohamed Slim";
      defaultEmail = "m.slim@insat.u-cartago.tn";
      defaultId = 3;
    } else if (role === "admin") {
      defaultName = name || "Mme. Sonia (Scolarité)";
      defaultEmail = "sonia.admin@insat.u-cartago.tn";
      defaultId = 1;
    } else if (name) {
      defaultName = name;
    }

    const newUserState: UserState = {
      isLoggedIn: true,
      role,
      year: role === "student" ? year : "",
      name: name || defaultName,
      email: email || defaultEmail,
      id: id ?? defaultId,
    };

    setUser(newUserState);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUserState));
  };

  const logout = () => {
    setUser(defaultUserState);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    // Cleanup legacy keys if they still exist in the browser.
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const updateYear = (year: string) => {
    if (user.role === "student") {
      const updated = { ...user, year };
      setUser(updated);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Prevent rendering children before checking sessionStorage to avoid hydration mismatch
  if (!isLoaded) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, login, logout, updateYear }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
