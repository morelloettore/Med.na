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

const EMAIL_ALIASES: Record<string, string> = {
  "admin@medna.com": "admin@medna.com.br",
  "funcionario@medna.com": "funcionario@medna.com.br",
};

const DEMO_USERS: User[] = [
  {
    id: "admin-carol-001",
    email: "admin@medna.com",
    role: "ADMIN",
    first_name: "Administrador",
    last_name: "Geral",
    phone: "(11) 99999-0001",
    is_active: true,
  },
  {
    id: "patient-joao-001",
    email: "paciente1@medna.com",
    role: "PATIENT",
    first_name: "Carlos",
    last_name: "Oliveira",
    phone: "(11) 98888-0001",
    is_active: true,
  },
  {
    id: "doctor-maria-001",
    email: "maria.santos@medna.com",
    role: "DOCTOR",
    first_name: "Maria",
    last_name: "Santos",
    phone: "(11) 99999-0002",
    is_active: true,
  },
  {
    id: "employee-pedro-001",
    email: "funcionario@medna.com",
    role: "EMPLOYEE",
    first_name: "Carla",
    last_name: "Mendes",
    phone: "(11) 99999-0003",
    is_active: true,
  },
];

const DEMO_CREDENTIALS: Record<string, string> = {
  "admin@medna.com": "admin123",
  "admin@medna.com.br": "admin123",
  "paciente1@medna.com": "paciente123",
  "maria.santos@medna.com": "medna123",
  "funcionario@medna.com": "func123",
  "funcionario@medna.com.br": "func123",
  "dr.roberto@medna.com.br": "medna123",
  "dra.juliana@medna.com.br": "medna123",
  "paciente.joao@gmail.com": "paciente123",
  "paciente.maria@gmail.com": "paciente123",
  "joao.silva@medna.com": "medna123",
  "ana.costa@medna.com": "medna123",
  "paciente2@medna.com": "paciente123",
};

const normalizeEmail = (value: string) => {
  const clean = value.trim().toLowerCase();
  return EMAIL_ALIASES[clean] || clean;
};

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
    const users = availableUsers.length > 0 ? availableUsers : DEMO_USERS;
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return { ok: false, error: "Por favor, informe seu e-mail." };
    }
    if (!password) {
      return { ok: false, error: "Por favor, informe sua senha." };
    }

    const users = availableUsers.length > 0 ? availableUsers : DEMO_USERS;
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);

    const expectedPass = DEMO_CREDENTIALS[normalizedEmail] || "123456";
    const isDemoPasswordValid = password === expectedPass || password === "123456" || password === "medna123" || password === "admin123" || password === "func123" || password === "paciente123";

    if (!user) {
      return { ok: false, error: "E-mail não cadastrado na base." };
    }

    if (!isDemoPasswordValid) {
      return { ok: false, error: "Senha incorreta para o e-mail informado." };
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
