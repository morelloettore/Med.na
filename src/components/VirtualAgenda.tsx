"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment, AppointmentStatus, AppointmentMode, User } from "@/types";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Video,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User as UserIcon,
  Stethoscope,
  Eye,
  RefreshCw
} from "lucide-react";

interface VirtualAgendaProps {
  appointments?: Appointment[];
  onOpenTelemedicine?: (appointment: Appointment) => void;
}

export const VirtualAgenda: React.FC<VirtualAgendaProps> = ({
  appointments: passedAppointments,
  onOpenTelemedicine,
}) => {
  const { currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<"MONTH" | "WEEK" | "DAY">("WEEK");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(passedAppointments || []);
  const [loading, setLoading] = useState(!passedAppointments);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    if (passedAppointments) {
      setAppointments(passedAppointments);
      setLoading(false);
      return;
    }

    if (!currentUser) return;
    setLoading(true);

    try {
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

      let query = supabase
        .from("appointments")
        .select(`
          *,
          specialty:specialties(*),
          location:locations(*)
        `)
        .order("scheduled_at", { ascending: true });

      if (currentUser.role === "PATIENT") {
        query = query.eq("patient_id", currentUser.id);
      } else if (currentUser.role === "DOCTOR") {
        query = query.eq("doctor_id", currentUser.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        const enriched = data.map((app) => ({
          ...app,
          patient_user: usersMap.get(app.patient_id),
          doctor_user: usersMap.get(app.doctor_id),
        }));
        setAppointments(enriched);
      }
    } catch (err) {
      console.error("Error loading agenda appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, passedAppointments]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (passedAppointments) {
      setAppointments(passedAppointments);
    }
  }, [passedAppointments]);

  // Date navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "MONTH") next.setMonth(next.getMonth() - 1);
    else if (viewMode === "WEEK") next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "MONTH") next.setMonth(next.getMonth() + 1);
    else if (viewMode === "WEEK") next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchesMode = modeFilter === "ALL" || app.mode === modeFilter;
    return matchesStatus && matchesMode;
  });

  // Calculate Daily Summaries
  const todayStr = new Date().toISOString().split("T")[0];
  const totalCount = filteredAppointments.length;
  const todayCount = filteredAppointments.filter(
    (a) => new Date(a.scheduled_at).toISOString().split("T")[0] === todayStr
  ).length;
  const confirmedCount = filteredAppointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = filteredAppointments.filter((a) => a.status === "COMPLETED").length;
  const canceledCount = filteredAppointments.filter((a) => a.status === "CANCELED").length;

  // Status Badge Styling Function
  const getStatusBadge = (status: AppointmentStatus, scheduledAt: string) => {
    const appDateStr = new Date(scheduledAt).toISOString().split("T")[0];
    const isToday = appDateStr === todayStr;

    if (status === "CANCELED") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
          Cancelada
        </span>
      );
    }
    if (status === "COMPLETED") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
          Concluída
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          Atendimento Hoje
        </span>
      );
    }
    if (status === "CONFIRMED") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Confirmada
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
        Agendada
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      {/* Header & Daily Resumo */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Agenda Virtual Integrada Med.na
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualização centralizada de consultas, escalas e horários do sistema.
          </p>
        </div>

        {/* Resumo Diário Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            Total: <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
            Hoje: <span className="font-bold">{todayCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            Confirmadas: <span className="font-bold">{confirmedCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
            Realizadas: <span className="font-bold">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar: View Modes & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Navigation & Date Display */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100"
          >
            Hoje
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 ml-2 capitalize">
            {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("MONTH")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "MONTH" ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode("WEEK")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "WEEK" ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode("DAY")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "DAY" ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Dia
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">Todos os status</option>
            <option value="SCHEDULED">Agendadas</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="COMPLETED">Concluídas</option>
            <option value="CANCELED">Canceladas</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">Todas as modalidades</option>
            <option value="IN_PERSON">Presencial</option>
            <option value="TELEMEDICINE">Telemedicina</option>
          </select>
        </div>
      </div>

      {/* Agenda Appointments List / Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          Carregando agenda em tempo real...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          Nenhuma consulta encontrada no período com os filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((app) => {
            const dateObj = new Date(app.scheduled_at);
            const isTele = app.mode === "TELEMEDICINE";

            return (
              <div
                key={app.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-teal-500 dark:hover:border-teal-400 transition-all space-y-3 relative group"
              >
                <div className="flex justify-between items-start">
                  {getStatusBadge(app.status, app.scheduled_at)}
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {isTele ? <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Building className="w-3.5 h-3.5 text-slate-500" />}
                    {isTele ? "Telemedicina" : "Presencial"}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentUser?.role === "DOCTOR"
                      ? `Paciente: ${app.patient_user?.first_name || ""} ${app.patient_user?.last_name || ""}`
                      : `Dr(a). ${app.doctor_user?.first_name || ""} ${app.doctor_user?.last_name || ""}`}
                  </h4>
                  <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                    {app.specialty?.name || "Clínica Geral"}
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {dateObj.toLocaleDateString("pt-BR")} às {dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {app.location && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Local: {app.location.name}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAppointment(app)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detalhes
                  </button>

                  {isTele && app.status !== "CANCELED" && onOpenTelemedicine && (
                    <button
                      onClick={() => onOpenTelemedicine(app)}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" /> Acessar Sala
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Detalhamento da Consulta</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {selectedAppointment.specialty?.name || "Consulta Médica"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Paciente</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAppointment.patient_user?.first_name} {selectedAppointment.patient_user?.last_name}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Médico</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Dr(a). {selectedAppointment.doctor_user?.first_name} {selectedAppointment.doctor_user?.last_name}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div>
                  <span className="font-bold">Data/Hora: </span>
                  {new Date(selectedAppointment.scheduled_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(selectedAppointment.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div>
                  <span className="font-bold">Modalidade: </span>
                  {selectedAppointment.mode === "TELEMEDICINE" ? "Telemedicina Virtual" : "Atendimento Presencial"}
                </div>
                <div>
                  <span className="font-bold">Valor / Tipo: </span>
                  {selectedAppointment.price ? `R$ ${selectedAppointment.price.toFixed(2)}` : "Atendido por Convênio"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
