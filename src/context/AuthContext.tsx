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

// Demo users for testing when Supabase is not available
const DEMO_USERS: User[] = [
  {
    id: "patient-joao-001",
    email: "joao.silva@example.com",
    role: "PATIENT",
    first_name: "João",
    last_name: "Silva",
    phone: "(11) 99999-0001",
    is_active: true,
  },
  {
    id: "doctor-maria-001",
    email: "maria.santos@example.com",
    role: "DOCTOR",
    first_name: "Maria",
    last_name: "Santos",
    phone: "(11) 99999-0002",
    is_active: true,
  },
  {
    id: "employee-pedro-001",
    email: "pedro.oliveira@example.com",
    role: "EMPLOYEE",
    first_name: "Pedro",
    last_name: "Oliveira",
    phone: "(11) 99999-0003",
    is_active: true,
  },
  {
    id: "admin-carol-001",
    email: "carol.admin@example.com",
    role: "ADMIN",
    first_name: "Carolina",
    last_name: "Admin",
    phone: "(11) 99999-0004",
    is_active: true,
  },
];

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
        } else {
          throw new Error("No users found in database");
        }
      } catch (err) {
        console.warn("Failed to load users from Supabase, using demo users:", err);
        
        // Fallback to demo users when Supabase is not available
        setAvailableUsers(DEMO_USERS);
        
        // Restore saved session or set default demo user
        const savedUserId = localStorage.getItem("medna_active_user_id");
        const found = DEMO_USERS.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        } else {
          // Default to Patient João
          const defaultUser = DEMO_USERS.find((u) => u.role === "PATIENT") || DEMO_USERS[0];
          setCurrentUser(defaultUser);
          localStorage.setItem("medna_active_user_id", defaultUser.id);
        }
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
