"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UserPlus,
  LogIn
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Logo } from "@/components/Logo";

interface LoginFormProps {
  onBackToSplash?: () => void;
}

export function LoginForm({ onBackToSplash }: LoginFormProps) {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Formatters for CPF and Phone
  const formatCPF = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

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
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(false);
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
    setPendingApprovalNotice(false);
    setSubmitting(true);

    // Non-patient roles (DOCTOR, EMPLOYEE, ADMIN) require Administrator approval via email notification
    const requiresApproval = regRole !== "PATIENT";

    const result = await signUp({
      email: regEmail,
      password: regPassword,
      role: regRole,
      first_name: regFirstName,
      last_name: regLastName,
      phone: regPhone,
      cpf: regCpf,
      is_active: !requiresApproval,
    });

    if (!result.ok) {
      setError(result.error || "Erro ao realizar cadastro.");
      setSubmitting(false);
      return;
    }

    if (result.pendingApproval) {
      setPendingApprovalNotice(true);
      setSubmitting(false);
      return;
    }

    setSuccessMsg("Conta criada com sucesso! Redirecionando...");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center px-4 py-12 transition-colors relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-teal-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-teal-500/20 dark:border-teal-500/30 overflow-hidden relative z-10">
        {/* Banner Header with Logo and Back Button */}
        <div className="bg-gradient-to-b from-teal-950 to-slate-900 p-8 text-white flex flex-col items-center justify-center border-b border-teal-800/40 relative">
          {onBackToSplash && (
            <button
              type="button"
              onClick={onBackToSplash}
              className="absolute top-4 left-4 text-xs font-bold text-teal-400 hover:text-teal-200 flex items-center gap-1 bg-teal-900/40 border border-teal-700/50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
          )}
          <Logo variant="full" size="xl" showSubtitle={true} />
        </div>

        {/* Tab Switcher: Login / Cadastro */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              !isRegister
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isRegister
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-teal-600/20 active:scale-[0.99]"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={regPhone}
                  maxLength={15}
                  onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={regCpf}
                  maxLength={14}
                  onChange={(e) => setRegCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Perfil / Perfil de Acesso</label>
              <select
                value={regRole}
                onChange={(e) => {
                  setRegRole(e.target.value as UserRole);
                  setError("");
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:border-teal-500"
              >
                <option value="PATIENT">Paciente</option>
                <option value="DOCTOR">Médico (Requer Aprovação)</option>
                <option value="EMPLOYEE">Funcionário / Recepção (Requer Aprovação)</option>
                <option value="ADMIN">Administrador (Requer Aprovação)</option>
              </select>
            </div>

            {regRole !== "PATIENT" && (
              <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <span className="font-bold block">✉ Requer Aprovação do Administrador</span>
                <p className="text-[11px] leading-relaxed">
                  Para o perfil de <strong>{regRole === "ADMIN" ? "Administrador" : regRole === "DOCTOR" ? "Médico" : "Funcionário"}</strong>, um e-mail de solicitação de cadastro será enviado para <strong>morelloettore79@gmail.com</strong> para autorizar sua conta.
                </p>
              </div>
            )}

            {pendingApprovalNotice && (
              <div className="p-4 bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                  <Mail className="w-4 h-4 text-teal-600" /> Solicitação de Cadastro Enviada por E-mail!
                </div>
                <p>
                  Sua solicitação de cadastro como <strong>{regRole}</strong> foi enviada para aprovação do Administrador (<strong>admin@medna.com</strong>).
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assim que o administrador aprovar seu acesso no painel de administração, você poderá realizar login normalmente com seu e-mail e senha.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setPendingApprovalNotice(false);
                  }}
                  className="mt-2 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Voltar para a Tela de Login
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Senha (mínimo 6 dígitos)</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Crie uma senha forte"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-2.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-md mt-2 text-xs"
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
