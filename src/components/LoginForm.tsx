"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  User as UserIcon,
  Phone,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  UserPlus,
  LogIn
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up State
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("PATIENT");
  const [regPassword, setRegPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    const result = await signIn(email, password);
    if (!result.ok) {
      setError(result.error || "Credenciais inválidas.");
      setSubmitting(false);
      return;
    }

    router.push("/");
  };

  const handleSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    const result = await signUp({
      email: regEmail,
      password: regPassword,
      role: regRole,
      first_name: regFirstName,
      last_name: regLastName,
      phone: regPhone,
      cpf: regCpf,
    });

    if (!result.ok) {
      setError(result.error || "Erro ao realizar cadastro.");
      setSubmitting(false);
      return;
    }

    setSuccessMsg("Conta criada com sucesso! Redirecionando...");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4 py-8 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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

        {/* Tab Switcher: Login / Cadastro */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              !isRegister
                ? "bg-white dark:bg-slate-800 text-sky-600 border-b-2 border-sky-600"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <LogIn className="w-4 h-4" /> Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              isRegister
                ? "bg-white dark:bg-slate-800 text-sky-600 border-b-2 border-sky-600"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <UserPlus className="w-4 h-4" /> Criar Conta
          </button>
        </div>

        {/* SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleSubmitSignIn} className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesse sua Conta</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Digite seu e-mail e senha para acessar a plataforma Med.na.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  E-mail institucional / pessoal
                </span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                    placeholder="seu.email@medna.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Senha
                </span>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
            >
              {submitting ? "Autenticando..." : "Entrar no Sistema"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSubmitSignUp} className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cadastre-se</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Crie suas credenciais para acessar os serviços do Med.na.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="Nome"
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Sobrenome</label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Sobrenome"
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={regCpf}
                  onChange={(e) => setRegCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Perfil / Perfil de Acesso</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:border-sky-500"
              >
                <option value="PATIENT">Paciente</option>
                <option value="DOCTOR">Médico</option>
                <option value="EMPLOYEE">Funcionário / Recepção</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Senha (mínimo 6 dígitos)</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Crie uma senha forte"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 py-2.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-md mt-2 text-xs"
            >
              {submitting ? "Cadastrando..." : "Concluir Cadastro"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
