"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  User as UserIcon,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Building,
  LogOut,
  Sparkles,
} from "lucide-react";

export const Navbar = () => {
  const { currentUser, availableUsers, loginAs, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "PATIENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <UserIcon className="w-3.5 h-3.5" /> Paciente
          </span>
        );
      case "DOCTOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Stethoscope className="w-3.5 h-3.5" /> Médico
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <UserCheck className="w-3.5 h-3.5" /> Funcionário
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <ShieldAlert className="w-3.5 h-3.5" /> Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
              Med<span className="text-sky-600">.na</span>
            </h1>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Sistema Médico Hospitalar
            </p>
          </div>
        </div>

        {/* Active User Info & Role Switcher */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 pl-3 rounded-lg text-sm">
            <span className="text-xs text-slate-500 font-medium">Alternar Perfil:</span>
            <select
              value={currentUser?.id || ""}
              onChange={(e) => loginAs(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-slate-900">
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-xs text-slate-500">{currentUser.email}</div>
              </div>

              {getRoleBadge(currentUser.role)}

              <button
                onClick={logout}
                title="Sair / Alternar Usuário"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
