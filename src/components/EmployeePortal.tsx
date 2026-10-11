"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment, HealthInsurance, User } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Video,
  Users,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";

export const EmployeePortal = () => {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchPatient, setSearchPatient] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"queue" | "insurances" | "checkin">("queue");

  const loadData = useCallback(async () => {
    try {
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

      const { data: apps } = await supabase
        .from("appointments")
        .select(`
          *,
          specialty:specialties(*),
          location:locations(*)
        `)
        .order("scheduled_at", { ascending: false });

      if (apps) {
        const enrichedApps = apps.map((app) => ({
          ...app,
          patient_user: usersMap.get(app.patient_id),
          doctor_user: usersMap.get(app.doctor_id),
        }));
        setAppointments(enrichedApps);
      }

      const { data: ins } = await supabase.from("health_insurances").select("*").order("name");
      if (ins) setInsurances(ins);
    } catch (err) {
      console.error("Error loading employee portal data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (appointmentId: string, status: "CONFIRMED" | "CANCELED" | "COMPLETED") => {
    let cancelReason = null;
    if (status === "CANCELED") {
      cancelReason = prompt("Informe o motivo do cancelamento pela recepção:");
      if (!cancelReason) return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status,
          cancel_reason: cancelReason,
          canceled_at: status === "CANCELED" ? new Date().toISOString() : null,
          canceled_by: status === "CANCELED" ? currentUser?.id : null
        })
        .eq("id", appointmentId);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      console.error("Update status error:", err);
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const name = `${app.patient_user?.first_name || ""} ${app.patient_user?.last_name || ""}`.toLowerCase();
    const matchesSearch = name.includes(searchPatient.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const scheduledCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const teleCount = appointments.filter((a) => a.mode === "TELEMEDICINE").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <UserCheck className="w-3.5 h-3.5" /> Recepção & Atendimento ao Cliente
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Painel do Funcionário / Recepção
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
              Gerencie filas de recepção, confirme agendamentos, realize check-in de pacientes e consulte convênios credenciados.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-md font-semibold text-xs transition-colors flex items-center gap-2 border border-white/20"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar Fila
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aguardando</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{scheduledCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmadas</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{confirmedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Realizadas</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{completedCount}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telemedicina</p>
            <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{teleCount}</h3>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl">
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "queue"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" /> Fila de Agendamentos
        </button>

        <button
          onClick={() => setActiveTab("insurances")}
          className={`px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "insurances"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Convênios Credenciados ({insurances.length})
        </button>
      </div>

      {activeTab === "queue" && (
        <div className="space-y-6">
          {/* Filters and Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome do paciente..."
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ALL">Todos os status</option>
                <option value="SCHEDULED">Agendadas (Aguardando)</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="COMPLETED">Realizadas</option>
                <option value="CANCELED">Canceladas</option>
              </select>
            </div>
          </div>

          {/* Appointments Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Gerenciamento Geral de Consultas</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Exibindo {filteredAppointments.length} consultas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Data/Hora</th>
                    <th className="px-6 py-3">Paciente</th>
                    <th className="px-6 py-3">Médico / Especialidade</th>
                    <th className="px-6 py-3">Modalidade</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações de Recepção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Nenhuma consulta encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {new Date(app.scheduled_at).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {new Date(app.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {app.patient_user?.first_name || "Paciente"} {app.patient_user?.last_name || ""}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {app.patient_user?.phone || app.patient_user?.email || "Sem contato"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-slate-900 dark:text-slate-100 font-semibold">
                            Dr(a). {app.doctor_user?.first_name || "Médico"} {app.doctor_user?.last_name || ""}
                          </div>
                          <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                            {app.specialty?.name || "Geral"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                            {app.mode === "TELEMEDICINE" ? (
                              <Video className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            )}
                            {app.mode === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            app.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : app.status === "COMPLETED"
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              : app.status === "CANCELED"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {app.status === "SCHEDULED" ? "Agendada" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          {app.status === "SCHEDULED" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, "CANCELED")}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          )}
                          {app.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                              className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              Check-in / Concluir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "insurances" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operadoras e Convênios Credenciados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lista de planos de saúde para consulta da recepção.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insurances.map((ins) => (
              <div key={ins.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{ins.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ANS: {ins.ans_code || "N/A"}</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                  Credenciado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
