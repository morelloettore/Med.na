"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
  loginAs: (userId: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  availableUsers: [],
  loginAs: async () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("first_name");

        if (error) throw error;
        if (data && data.length > 0) {
          setAvailableUsers(data);

          // Restore saved session or set default user (e.g. Patient João or Admin)
          const savedUserId = localStorage.getItem("medna_active_user_id");
          const found = data.find((u) => u.id === savedUserId);
          if (found) {
            setCurrentUser(found);
          } else {
            // Default to Patient João or first user
            const defaultUser = data.find((u) => u.role === "PATIENT") || data[0];
            setCurrentUser(defaultUser);
            localStorage.setItem("medna_active_user_id", defaultUser.id);
          }
        }
      } catch (err) {
        console.error("Failed to load users from Supabase", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const loginAs = async (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("medna_active_user_id", user.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("medna_active_user_id");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        loginAs,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
