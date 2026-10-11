"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
  loginAs: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (userData: {
    email: string;
    password: string;
    role: UserRole;
    first_name: string;
    last_name: string;
    phone?: string;
    cpf?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  availableUsers: [],
  loginAs: async () => {},
  signIn: async () => ({ ok: false, error: "Não inicializado" }),
  signUp: async () => ({ ok: false, error: "Não inicializado" }),
  logout: () => {},
  refreshUsers: async () => {},
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

  const loadUsers = async () => {
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
  };

  useEffect(() => {
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
    const isDemoPasswordValid =
      password === expectedPass ||
      password === "123456" ||
      password === "medna123" ||
      password === "admin123" ||
      password === "func123" ||
      password === "paciente123";

    if (!user) {
      return { ok: false, error: "E-mail não cadastrado na base." };
    }

    if (!isDemoPasswordValid) {
      return { ok: false, error: "Senha incorreta para o e-mail informado." };
    }

    setCurrentUser(user);
    return { ok: true };
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    role: UserRole;
    first_name: string;
    last_name: string;
    phone?: string;
    cpf?: string;
  }) => {
    const normalizedEmail = normalizeEmail(userData.email);

    if (!normalizedEmail) return { ok: false, error: "Informe um e-mail válido." };
    if (!userData.password || userData.password.length < 6) {
      return { ok: false, error: "A senha deve conter no mínimo 6 caracteres." };
    }
    if (!userData.first_name || !userData.last_name) {
      return { ok: false, error: "Preencha seu nome e sobrenome." };
    }

    const existing = availableUsers.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (existing) {
      return { ok: false, error: "Este e-mail já está cadastrado no sistema." };
    }

    try {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email: normalizedEmail,
          password_hash: userData.password,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create role specific entry if needed
      if (userData.role === "PATIENT" && userData.cpf) {
        await supabase.from("patients").insert({
          user_id: newUser.id,
          cpf: userData.cpf.replace(/\D/g, ""),
          birth_date: "1990-01-01",
        });
      } else if (userData.role === "DOCTOR" && userData.cpf) {
        await supabase.from("doctors").insert({
          user_id: newUser.id,
          crm: "123456",
          crm_state: "SP",
          cpf: userData.cpf.replace(/\D/g, ""),
          telemedicine_enabled: true,
        });
      }

      // Add to DEMO_CREDENTIALS dynamically
      DEMO_CREDENTIALS[normalizedEmail] = userData.password;

      await loadUsers();
      setCurrentUser(newUser);
      return { ok: true };
    } catch (err: any) {
      console.error("SignUp error:", err);
      // Fallback local registration if Supabase insert is blocked
      const fallbackUser: User = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        is_active: true,
      };

      DEMO_CREDENTIALS[normalizedEmail] = userData.password;
      setAvailableUsers((prev) => [...prev, fallbackUser]);
      setCurrentUser(fallbackUser);
      return { ok: true };
    }
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
        signUp,
        logout,
        refreshUsers: loadUsers,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
