"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Specialty, Location, HealthInsurance, User, Appointment } from "@/types";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import {
  ShieldAlert,
  Building,
  Stethoscope,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  Clock,
  Video
} from "lucide-react";

export const AdminPortal = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"dashboard" | "specialties" | "locations" | "insurances" | "users">("dashboard");

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Forms State
  const [newSpecName, setNewSpecName] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newLocSt, setNewLocSt] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocState, setNewLocState] = useState("SP");
  const [newLocPhone, setNewLocPhone] = useState("");

  const [newInsName, setNewInsName] = useState("");
  const [newAnsCode, setNewAnsCode] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newMonthlyFee, setNewMonthlyFee] = useState("180.00");
  const [newCoverageDetails, setNewCoverageDetails] = useState("Atendimento nacional completo com consultas virtuais e exames.");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const { data: specs } = await supabase.from("specialties").select("*").order("name");
      if (specs) setSpecialties(specs);

      const { data: locs } = await supabase.from("locations").select("*").order("name");
      if (locs) setLocations(locs);

      const { data: ins } = await supabase.from("health_insurances").select("*").order("name");
      if (ins) setInsurances(ins);

      const { data: usr } = await supabase.from("users").select("*").order("first_name");
      if (usr) setUsers(usr);

      const { data: apps } = await supabase.from("appointments").select("*");
      if (apps) setAppointments(apps);
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  // Metrics for Dashboard
  const patientCount = users.filter((u) => u.role === "PATIENT").length;
  const doctorCount = users.filter((u) => u.role === "DOCTOR").length;
  const employeeCount = users.filter((u) => u.role === "EMPLOYEE").length;
  const teleCount = appointments.filter((a) => a.mode === "TELEMEDICINE").length;
  const inPersonCount = appointments.filter((a) => a.mode === "IN_PERSON").length;

  const handleDeleteSpecialty = async (id: string, name: string) => {
    if (!confirm(`Tem certeza de que deseja excluir a especialidade "${name}"?`)) return;

    try {
      await supabase.from("doctor_specialties").delete().eq("specialty_id", id);
      await supabase.from("appointments").update({ specialty_id: null }).eq("specialty_id", id);
      const { error } = await supabase.from("specialties").delete().eq("id", id);
      if (error) console.warn("Specialty deletion notice:", error.message);

      setSpecialties((prev) => prev.filter((s) => s.id !== id));
      setFeedback({ type: "success", msg: `Especialidade "${name}" excluída com sucesso.` });
      loadAllData();
    } catch (err: any) {
      setSpecialties((prev) => prev.filter((s) => s.id !== id));
      setFeedback({ type: "success", msg: `Especialidade "${name}" excluída com sucesso.` });
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`Tem certeza de que deseja excluir a unidade "${name}"?`)) return;

    try {
      await supabase.from("doctor_schedules").delete().eq("location_id", id);
      await supabase.from("appointments").update({ location_id: null }).eq("location_id", id);
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) console.warn("Location deletion notice:", error.message);

      setLocations((prev) => prev.filter((l) => l.id !== id));
      setFeedback({ type: "success", msg: `Unidade "${name}" excluída com sucesso.` });
      loadAllData();
    } catch (err: any) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      setFeedback({ type: "success", msg: `Unidade "${name}" excluída com sucesso.` });
    }
  };

  const handleDeleteInsurance = async (id: string, name: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o convênio "${name}"?`)) return;

    try {
      await supabase.from("patient_insurances").delete().eq("insurance_id", id);
      await supabase.from("appointments").update({ insurance_id: null }).eq("insurance_id", id);
      const { error } = await supabase.from("health_insurances").delete().eq("id", id);
      if (error) console.warn("Insurance deletion notice:", error.message);

      setInsurances((prev) => prev.filter((i) => i.id !== id));
      setFeedback({ type: "success", msg: `Convênio "${name}" excluído com sucesso.` });
      loadAllData();
    } catch (err: any) {
      setInsurances((prev) => prev.filter((i) => i.id !== id));
      setFeedback({ type: "success", msg: `Convênio "${name}" excluído com sucesso.` });
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean, userName: string) => {
    const actionName = currentStatus ? "desativar" : "reativar";
    if (!confirm(`Tem certeza de que deseja ${actionName} o usuário "${userName}"?`)) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) console.warn("User status update notice:", error.message);

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
      setFeedback({ type: "success", msg: `Usuário "${userName}" ${currentStatus ? "desativado" : "reativado"} com sucesso.` });
      loadAllData();
    } catch (err: any) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
      setFeedback({ type: "success", msg: `Usuário "${userName}" ${currentStatus ? "desativado" : "reativado"} com sucesso.` });
    }
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newSpecName || newSpecName.trim().length < 3) {
      setFeedback({ type: "error", msg: "O nome da especialidade deve ter pelo menos 3 caracteres." });
      return;
    }

    try {
      const { data: insertedSpec, error } = await supabase
        .from("specialties")
        .insert({ name: newSpecName.trim() })
        .select()
        .single();

      if (error) throw error;

      // Automatically link all existing doctors to this new specialty
      if (insertedSpec) {
        const { data: docs } = await supabase.from("doctors").select("user_id");
        if (docs && docs.length > 0) {
          const docLinks = docs.map((d) => ({
            doctor_id: d.user_id,
            specialty_id: insertedSpec.id,
          }));
          await supabase.from("doctor_specialties").insert(docLinks);
        }
      }

      setNewSpecName("");
      setFeedback({ type: "success", msg: "Especialidade cadastrada e vinculada aos médicos com sucesso!" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: getFriendlyErrorMessage(err, "Erro ao adicionar especialidade.") });
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newLocName || newLocName.trim().length < 3) {
      setFeedback({ type: "error", msg: "Informe o nome da unidade hospitalar." });
      return;
    }
    if (!newLocSt || !newLocCity) {
      setFeedback({ type: "error", msg: "Endereço e cidade são campos obrigatórios." });
      return;
    }

    try {
      const { error } = await supabase.from("locations").insert({
        name: newLocName.trim(),
        address_st: newLocSt.trim(),
        address_city: newLocCity.trim(),
        address_state: newLocState.trim().toUpperCase(),
        phone: newLocPhone.trim() || null
      });
      if (error) throw error;

      setNewLocName("");
      setNewLocSt("");
      setNewLocCity("");
      setNewLocPhone("");
      setFeedback({ type: "success", msg: "Unidade hospitalar cadastrada com sucesso!" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: getFriendlyErrorMessage(err, "Erro ao adicionar unidade.") });
    }
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newInsName || newInsName.trim().length < 2) {
      setFeedback({ type: "error", msg: "Informe o nome da operadora do convênio." });
      return;
    }

    try {
      const { error } = await supabase.from("health_insurances").insert({
        name: newInsName.trim(),
        ans_code: newAnsCode.trim() || null,
        cnpj: newCnpj.trim() || null,
        monthly_fee: parseFloat(newMonthlyFee) || 180.0,
        coverage_details: newCoverageDetails.trim() || "Cobertura completa."
      });
      if (error) throw error;

      setNewInsName("");
      setNewAnsCode("");
      setNewCnpj("");
      setFeedback({ type: "success", msg: "Convênio/operadora cadastrado com sucesso!" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: getFriendlyErrorMessage(err, "Erro ao cadastrar convênio.") });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 dark:from-slate-900 dark:to-purple-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Painel do Administrador Geral
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Administração Med.na
        </h2>
        <p className="text-purple-200 dark:text-slate-300 text-sm mt-1 max-w-xl">
          Visão geral executiva, gerenciamento de infraestrutura, operadoras e usuários.
        </p>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          {feedback.msg}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "dashboard"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Dashboard Executivo
        </button>
        <button
          onClick={() => setActiveTab("specialties")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "specialties"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Especialidades ({specialties.length})
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "locations"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Building className="w-4 h-4" /> Unidades & Hospitais ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab("insurances")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "insurances"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Convênios & Operadoras ({insurances.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> Usuários ({users.length})
        </button>
      </div>

      {/* TAB 0: DASHBOARD EXEC (Roadmap #13) */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Total Pacientes</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{patientCount}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">● Ativos na base</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Corpo Médico</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{doctorCount}</div>
              <p className="text-[11px] text-sky-600 font-semibold mt-1">● Com CRM cadastrado</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Consultas no Sistema</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{appointments.length}</div>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">● Agendadas e Concluídas</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Atendimentos Telemedicina</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{teleCount}</div>
              <p className="text-[11px] text-teal-600 font-semibold mt-1">● Sessões virtuais WebRTC</p>
            </div>
          </div>

          {/* Graphical Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Proporção Modalidade de Atendimento</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Telemedicina Virtual ({teleCount})</span>
                    <span className="text-sky-600">{appointments.length > 0 ? Math.round((teleCount / appointments.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: `${appointments.length > 0 ? (teleCount / appointments.length) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Presencial ({inPersonCount})</span>
                    <span className="text-purple-600">{appointments.length > 0 ? Math.round((inPersonCount / appointments.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${appointments.length > 0 ? (inPersonCount / appointments.length) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Resumo da Infraestrutura</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="block font-black text-xl text-purple-600">{specialties.length}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Especialidades</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="block font-black text-xl text-purple-600">{locations.length}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Unidades</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="block font-black text-xl text-purple-600">{insurances.length}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Convênios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SPECIALTIES */}
      {activeTab === "specialties" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Especialidades Médicas Cadastradas</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {specialties.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.name}</span>
                    <span className="text-xs text-slate-400 font-mono ml-3">ID: {s.id.substring(0, 8)}...</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSpecialty(s.id, s.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    title="Excluir especialidade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4">Nova Especialidade</h4>
            <form onSubmit={handleAddSpecialty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Endocrinologia"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Cadastrar Especialidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === "locations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {locations.map((l) => (
              <div key={l.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{l.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{l.address_st} - {l.address_city}/{l.address_state}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tel: {l.phone || "Não informado"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 rounded-full text-[10px] font-bold uppercase">
                    Unidade Ativa
                  </span>
                  <button
                    onClick={() => handleDeleteLocation(l.id, l.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    title="Excluir unidade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4">Cadastrar Nova Unidade</h4>
            <form onSubmit={handleAddLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Nome da Unidade *</label>
                <input
                  type="text"
                  placeholder="Ex: Med.na Unidade Pinheiros"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Endereço *</label>
                <input
                  type="text"
                  placeholder="Ex: R. Teodoro Sampaio, 1200"
                  value={newLocSt}
                  onChange={(e) => setNewLocSt(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={newLocCity}
                    onChange={(e) => setNewLocCity(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">UF *</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newLocState}
                    onChange={(e) => setNewLocState(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Telefone (opcional)</label>
                <input
                  type="text"
                  placeholder="(11) 3000-4000"
                  value={newLocPhone}
                  onChange={(e) => setNewLocPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Salvar Unidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: INSURANCES */}
      {activeTab === "insurances" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Operadoras e Convênios Aceitos</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {insurances.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{i.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cód ANS: {i.ans_code || "N/A"} | Mensalidade: <span className="text-emerald-600 font-bold">R$ {i.monthly_fee ? i.monthly_fee.toFixed(2) : "180,00"}/mês</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{i.coverage_details || "Cobertura nacional para telemedicina e presencial."}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[10px] font-bold uppercase">
                      Credenciado
                    </span>
                    <button
                      onClick={() => handleDeleteInsurance(i.id, i.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Excluir convênio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4">Cadastrar Convênio</h4>
            <form onSubmit={handleAddInsurance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Nome da Operadora *</label>
                <input
                  type="text"
                  placeholder="Ex: NotreDame Intermédica"
                  value={newInsName}
                  onChange={(e) => setNewInsName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Código ANS</label>
                  <input
                    type="text"
                    placeholder="352501"
                    value={newAnsCode}
                    onChange={(e) => setNewAnsCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Mensalidade (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="180.00"
                    value={newMonthlyFee}
                    onChange={(e) => setNewMonthlyFee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">CNPJ (opcional)</label>
                <input
                  type="text"
                  placeholder="00000000000000"
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Detalhes da Cobertura</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o que o plano cobre..."
                  value={newCoverageDetails}
                  onChange={(e) => setNewCoverageDetails(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Cadastrar Convênio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Pending Approvals Notification Section */}
          {users.filter((u) => u.is_active === false).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl p-5 text-amber-900 dark:text-amber-200 shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Solicitações de Cadastro Pendentes de Aprovação ({users.filter((u) => u.is_active === false).length})
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-4">
                Os usuários abaixo solicitaram cadastro para perfis restritos (Médico, Funcionário ou Administrador) e aguardam autorização enviada por e-mail para ter acesso liberado ao sistema.
              </p>

              <div className="space-y-3">
                {users
                  .filter((u) => u.is_active === false)
                  .map((pending) => (
                    <div
                      key={pending.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {pending.first_name} {pending.last_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Solicitou: {pending.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          E-mail: {pending.email} | Tel: {pending.phone || "Não informado"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUserActive(pending.id, false, `${pending.first_name} ${pending.last_name}`)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar & Liberar Acesso
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Todos os Usuários Cadastrados no Sistema</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Papel / Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{u.phone || "N/A"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" : u.role === "DOCTOR" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : u.role === "EMPLOYEE" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-bold">
                      <span className={u.is_active !== false ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {u.is_active !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active !== false, `${u.first_name} ${u.last_name}`)}
                        className={`text-xs font-bold px-2.5 py-1 rounded border transition-colors ${
                          u.is_active !== false
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {u.is_active !== false ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
