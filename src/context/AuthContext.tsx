"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
  loginAs: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  availableUsers: [],
  loginAs: async () => {},
  signIn: async () => ({ ok: false, error: "Não inicializado" }),
  logout: () => {},
  loading: true,
});

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

const DEMO_CREDENTIALS: Record<string, string> = {
  "joao.silva@example.com": "joao123",
  "maria.santos@example.com": "medna123",
  "pedro.oliveira@example.com": "func123",
  "carol.admin@example.com": "admin123",
  "paciente1@medna.com": "paciente123",
  "funcionario@medna.com": "funcionario123",
  "admin@medna.com": "admin123",
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("medna_active_user_id", user.id);
    } else {
      localStorage.removeItem("medna_active_user_id");
    }
  };

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase.from("users").select("*").order("first_name");

        if (!error && data && data.length > 0) {
          setAvailableUsers(data);

          const savedUserId = localStorage.getItem("medna_active_user_id");
          const found = data.find((u) => u.id === savedUserId);
          if (found) {
            setCurrentUserState(found);
          }
          return;
        }

        throw error || new Error("No users found in database");
      } catch (err) {
        console.warn("Failed to load users from Supabase, using demo users:", err);
        setAvailableUsers(DEMO_USERS);

        const savedUserId = localStorage.getItem("medna_active_user_id");
        const found = DEMO_USERS.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUserState(found);
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
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const users = availableUsers.length > 0 ? availableUsers : DEMO_USERS;
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    const isDemoPasswordValid = DEMO_CREDENTIALS[normalizedEmail] === password;

    if (!user) {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    if (!isDemoPasswordValid) {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    setCurrentUser(user);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        loginAs,
        signIn,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
