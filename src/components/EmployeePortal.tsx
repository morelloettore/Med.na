"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment, HealthInsurance } from "@/types";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Video
} from "lucide-react";

export const EmployeePortal = () => {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchPatient, setSearchPatient] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: apps } = await supabase
        .from("appointments")
        .select(`
          *,
          patient_user:users!patient_id(*),
          doctor_user:users!doctor_id(*),
          specialty:specialties(*),
          location:locations(*)
        `)
        .order("scheduled_at", { ascending: false });

      if (apps) setAppointments(apps);

      const { data: ins } = await supabase.from("health_insurances").select("*");
      if (ins) setInsurances(ins);
    } catch (err) {
      console.error("Error loading employee portal data:", err);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: "CONFIRMED" | "CANCELED") => {
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
      loadData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Gestão de Recepção & Atendimentos
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Painel do Funcionário / Recepção
        </h2>
        <p className="text-amber-100 text-sm mt-1 max-w-xl">
          Confirme agendamentos de pacientes, gerencie filas de atendimento e acerte informações de convênios.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Gerenciamento Geral de Consultas</h3>
          <span className="text-xs text-slate-500 font-semibold">Exibindo {filteredAppointments.length} consultas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-3">Data/Hora</th>
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Médico / Especialidade</th>
                <th className="px-6 py-3">Modalidade</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma consulta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-slate-900">
                        {new Date(app.scheduled_at).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-slate-500">
                        {new Date(app.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {app.patient_user?.first_name} {app.patient_user?.last_name}
                      </div>
                      <div className="text-xs text-slate-500">{app.patient_user?.phone || app.patient_user?.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-semibold">
                        Dr(a). {app.doctor_user?.first_name} {app.doctor_user?.last_name}
                      </div>
                      <div className="text-xs text-sky-700 font-medium">{app.specialty?.name || "Geral"}</div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        {app.mode === "TELEMEDICINE" ? <Video className="w-3.5 h-3.5 text-sky-600" /> : <Building className="w-3.5 h-3.5 text-slate-500" />}
                        {app.mode === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        app.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-800"
                          : app.status === "CANCELED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {app.status === "SCHEDULED" ? "Agendada" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {app.status === "SCHEDULED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "CANCELED")}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </>
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
  );
};
