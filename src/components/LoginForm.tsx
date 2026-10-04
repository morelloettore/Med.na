"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  User as UserIcon,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("admin@medna.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await signIn(email, password);
    if (!result.ok) {
      setError(result.error || "Credenciais inválidas.");
      setSubmitting(false);
      return;
    }

    router.push("/");
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setSubmitting(true);

    const result = await signIn(demoEmail, demoPass);
    if (!result.ok) {
      setError(result.error || "Erro ao efetuar login de demonstração.");
      setSubmitting(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Med<span className="text-sky-200">.na</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sky-100 font-medium">
                Sistema Clínico & Hospitalar
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Entrar no sistema</h2>
            <p className="text-xs text-slate-500 mt-1">
              Digite seu e-mail e senha para acessar o painel correspondente ao seu perfil.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                E-mail institucional / usuário
              </span>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none ring-0 focus:border-sky-500 focus:bg-white"
                  placeholder="usuario@medna.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Senha
              </span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none ring-0 focus:border-sky-500 focus:bg-white"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
          >
            {submitting ? "Entrando..." : "Entrar no Sistema"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Demonstration Logins Section for Evaluators/Professors */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Logins de Demonstração para Avaliação
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Clique em um dos perfis abaixo para entrar automaticamente no sistema:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@medna.com", "admin123")}
                className="p-2.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-900 font-semibold hover:bg-purple-100 flex items-center gap-2 transition-all text-left"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">Administrador</div>
                  <div className="text-[10px] text-purple-700">admin@medna.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("paciente1@medna.com", "paciente123")}
                className="p-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 flex items-center gap-2 transition-all text-left"
              >
                <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold">Paciente</div>
                  <div className="text-[10px] text-blue-700">paciente1@medna.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("maria.santos@medna.com", "medna123")}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 font-semibold hover:bg-emerald-100 flex items-center gap-2 transition-all text-left"
              >
                <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Médico</div>
                  <div className="text-[10px] text-emerald-700">maria.santos@medna.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("funcionario@medna.com", "func123")}
                className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 flex items-center gap-2 transition-all text-left"
              >
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold">Recepção</div>
                  <div className="text-[10px] text-amber-700">funcionario@medna.com</div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
