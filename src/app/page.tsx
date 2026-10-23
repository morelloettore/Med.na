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
import { Logo } from "@/components/Logo";
import { WelcomeScreen } from "@/components/WelcomeScreen";

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [entered, setEntered] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center transition-colors">
        <div className="text-center space-y-4">
          <Logo variant="full" size="lg" showSubtitle={false} />
          <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Carregando Med.na System...</p>
        </div>
      </div>
    );
  }

  if (!entered) {
    return <WelcomeScreen onEnter={() => setEntered(true)} />;
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onToggleAiAssistant={() => setAiOpen(!aiOpen)} />

      <main className="flex-1">
        {currentUser?.role === "PATIENT" && <PatientPortal />}
        {currentUser?.role === "DOCTOR" && <DoctorPortal />}
        {currentUser?.role === "EMPLOYEE" && <EmployeePortal />}
        {currentUser?.role === "ADMIN" && <AdminPortal />}
      </main>

      <AiAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Logo variant="horizontal" size="sm" />
          <p>© 2025 Med.na Clínica Médica Virtual & Gestão Hospitalar. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
            <span>Privacidade</span>
            <span>•</span>
            <span>Termos de Uso</span>
            <span>•</span>
            <span>Telemedicina ICP-Brasil</span>
          </div>
        </div>
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
