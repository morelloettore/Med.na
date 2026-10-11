"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { PatientPortal } from "@/components/PatientPortal";
import { DoctorPortal } from "@/components/DoctorPortal";
import { EmployeePortal } from "@/components/EmployeePortal";
import { AdminPortal } from "@/components/AdminPortal";
import { LoginForm } from "@/components/LoginForm";
import { AiAssistant } from "@/components/AiAssistant";

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando Med.na System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onToggleAiAssistant={() => setAiOpen(!aiOpen)} />

      <main className="flex-1">
        {currentUser?.role === "PATIENT" && <PatientPortal />}
        {currentUser?.role === "DOCTOR" && <DoctorPortal />}
        {currentUser?.role === "EMPLOYEE" && <EmployeePortal />}
        {currentUser?.role === "ADMIN" && <AdminPortal />}
      </main>

      <AiAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2025 Med.na Clinica Médica & Gestão Hospitalar. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
