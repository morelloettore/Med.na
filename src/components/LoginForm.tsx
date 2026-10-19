"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  UserPlus,
  LogIn
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Logo } from "@/components/Logo";

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
  const [regAuthCode, setRegAuthCode] = useState("");
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

    // Validate authorization key requirement for non-patient roles
    if (regRole !== "PATIENT") {
      const validCodeMap: Record<UserRole, string> = {
        DOCTOR: "MEDNA-MEDICO-2025",
        EMPLOYEE: "MEDNA-FUNC-2025",
        ADMIN: "MEDNA-ADMIN-2025",
        PATIENT: "",
      };

      const requiredCode = validCodeMap[regRole];
      if (!regAuthCode || regAuthCode.trim().toUpperCase() !== requiredCode) {
        setError(
          `Código de autorização inválido ou ausente para a criação de conta como ${
            regRole === "ADMIN" ? "Administrador" : regRole === "DOCTOR" ? "Médico" : "Funcionário"
          }. Entre em contato com a administração hospitalar Med.na.`
        );
        return;
      }
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center px-4 py-12 transition-colors relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-teal-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-teal-500/20 dark:border-teal-500/30 overflow-hidden relative z-10">
        {/* Banner Header with Logo */}
        <div className="bg-gradient-to-b from-teal-950 to-slate-900 p-8 text-white flex flex-col items-center justify-center border-b border-teal-800/40">
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
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={regCpf}
                  onChange={(e) => setRegCpf(e.target.value)}
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
                  setRegAuthCode("");
                  setError("");
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:border-teal-500"
              >
                <option value="PATIENT">Paciente</option>
                <option value="DOCTOR">Médico (Requer Código Institucional)</option>
                <option value="EMPLOYEE">Funcionário / Recepção (Requer Código Institucional)</option>
                <option value="ADMIN">Administrador (Requer Código Institucional)</option>
              </select>
            </div>

            {regRole !== "PATIENT" && (
              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-1 flex justify-between">
                  <span>Código de Autorização Institucional</span>
                  <span className="text-[10px] font-normal lowercase text-slate-400">(ex: MEDNA-{regRole}-2025)</span>
                </label>
                <input
                  type="text"
                  value={regAuthCode}
                  onChange={(e) => setRegAuthCode(e.target.value)}
                  placeholder={`Informe o código para ${regRole}`}
                  required
                  className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 font-mono"
                />
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
