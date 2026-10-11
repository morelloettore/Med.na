"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Logo } from "@/components/Logo";
import {
  User as UserIcon,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  Bot
} from "lucide-react";

interface NavbarProps {
  onToggleAiAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleAiAssistant }) => {
  const { currentUser, availableUsers, loginAs, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "PATIENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <UserIcon className="w-3.5 h-3.5" /> Paciente
          </span>
        );
      case "DOCTOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Stethoscope className="w-3.5 h-3.5" /> Médico
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <UserCheck className="w-3.5 h-3.5" /> Funcionário
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 shadow-sm transition-colors">
      {profileOpen && currentUser && (
        <UserProfileModal user={currentUser} onClose={() => setProfileOpen(false)} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center">
          <Logo variant="horizontal" size="md" />
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* AI Assistant Button */}
          {onToggleAiAssistant && (
            <button
              onClick={onToggleAiAssistant}
              className="px-3 py-1.5 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/60 dark:border-teal-800/60 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs hover:shadow-sm"
              title="Abrir Assistente Virtual Med.na IA"
            >
              <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="hidden md:inline">IA Med.na</span>
            </button>
          )}

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === "light" ? "Alternar para Modo Escuro" : "Alternar para Modo Claro"}
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Role Switcher */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-1.5 pl-3 rounded-xl text-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Perfil:</span>
            <select
              value={currentUser?.id || ""}
              onChange={(e) => loginAs(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setProfileOpen(true)}
                className="text-right hidden md:block hover:opacity-80 transition-opacity"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.email}</div>
              </button>

              {getRoleBadge(currentUser.role)}

              <button
                onClick={logout}
                title="Sair do Sistema"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
