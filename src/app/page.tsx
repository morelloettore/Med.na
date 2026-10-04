"use client";

import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { PatientPortal } from "@/components/PatientPortal";
import { DoctorPortal } from "@/components/DoctorPortal";
import { EmployeePortal } from "@/components/EmployeePortal";
import { AdminPortal } from "@/components/AdminPortal";
import { LoginForm } from "@/components/LoginForm";

function MainApp() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Carregando Med.na System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {currentUser?.role === "PATIENT" && <PatientPortal />}
        {currentUser?.role === "DOCTOR" && <DoctorPortal />}
        {currentUser?.role === "EMPLOYEE" && <EmployeePortal />}
        {currentUser?.role === "ADMIN" && <AdminPortal />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2025 Med.na Clinica Médica & Gestão Hospitalar. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
