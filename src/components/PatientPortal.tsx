"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Doctor, Specialty, Location, HealthInsurance, PatientInsurance, Appointment, DoctorSchedule, User } from "@/types";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Stethoscope,
  MapPin,
  ShieldCheck,
  Video,
  Building,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  FileText
} from "lucide-react";

const DEFAULT_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export const PatientPortal = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"book" | "appointments" | "insurances">("book");

  // Data states
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [patientInsurances, setPatientInsurances] = useState<PatientInsurance[]>([]);
  const [allInsurances, setAllInsurances] = useState<HealthInsurance[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Booking Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedInsurance, setSelectedInsurance] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<"IN_PERSON" | "TELEMEDICINE">("IN_PERSON");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // New Insurance Form State
  const [newInsuranceId, setNewInsuranceId] = useState<string>("");
  const [newCardNumber, setNewCardNumber] = useState<string>("");
  const [newValidUntil, setNewValidUntil] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      // Fetch users map for joining
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

      // 1. Fetch Specialties
      const { data: specs } = await supabase.from("specialties").select("*").order("name");
      if (specs) setSpecialties(specs);

      // 2. Fetch Doctors
      const { data: docs } = await supabase.from("doctors").select("*");
      if (docs) {
        const enrichedDocs = docs.map((d) => ({
          ...d,
          user: usersMap.get(d.user_id),
        }));
        setDoctors(enrichedDocs);
      }

      // 3. Fetch Locations
      const { data: locs } = await supabase.from("locations").select("*");
      if (locs) setLocations(locs);

      // 4. Fetch Health Insurances
      const { data: ins } = await supabase.from("health_insurances").select("*");
      if (ins) setAllInsurances(ins);

      // 5. Fetch Patient Insurances
      if (currentUser) {
        const { data: patIns } = await supabase
          .from("patient_insurances")
          .select("*, insurance:health_insurances(*)")
          .eq("patient_id", currentUser.id);
        if (patIns) setPatientInsurances(patIns);

        // 6. Fetch Patient Appointments without foreign key relationship error
        const { data: apps } = await supabase
          .from("appointments")
          .select(`
            *,
            specialty:specialties(*),
            location:locations(*)
          `)
          .eq("patient_id", currentUser.id)
          .order("scheduled_at", { ascending: false });

        if (apps) {
          const enrichedApps = apps.map((app) => ({
            ...app,
            patient_user: usersMap.get(app.patient_id),
            doctor_user: usersMap.get(app.doctor_id),
          }));
          setAppointments(enrichedApps);
        }
      }
    } catch (err) {
      console.error("Error loading patient portal data:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser, loadData]);

  // Generate Available Time Slots when Doctor and Date change
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    async function generateSlots() {
      // Calculate weekday (0 = Sunday, 1 = Monday, ...)
      const dateObj = new Date(selectedDate + "T12:00:00");
      const weekday = dateObj.getDay();

      // Get existing appointments for that doctor on that date
      const startOfDay = `${selectedDate}T00:00:00Z`;
      const endOfDay = `${selectedDate}T23:59:59Z`;

      const { data: existingApps } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", selectedDoctor)
        .neq("status", "CANCELED")
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay);

      const bookedTimes = new Set(
        existingApps?.map((a) => {
          const d = new Date(a.scheduled_at);
          return d.toTimeString().substring(0, 5);
        }) || []
      );

      // Fetch doctor schedule for this weekday
      const { data: schedules } = await supabase
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", selectedDoctor)
        .eq("weekday", weekday);

      let rawSlots: string[] = [];

      if (schedules && schedules.length > 0) {
        // Generate slots based on doctor's schedule
        schedules.forEach((sched: DoctorSchedule) => {
          let current = sched.start_time.substring(0, 5);
          const end = sched.end_time.substring(0, 5);

          while (current < end) {
            rawSlots.push(current);
            const [h, m] = current.split(":").map(Number);
            const totalMin = h * 60 + m + (sched.slot_minutes || 30);
            const nextH = Math.floor(totalMin / 60)
              .toString()
              .padStart(2, "0");
            const nextM = (totalMin % 60).toString().padStart(2, "0");
            current = `${nextH}:${nextM}`;
          }
        });
      } else {
        // Fallback standard slots for any day (08:00 to 17:00) so user can always schedule
        rawSlots = DEFAULT_TIME_SLOTS;
      }

      // Filter out already booked slots
      const finalSlots = Array.from(new Set(rawSlots)).filter((slot) => !bookedTimes.has(slot)).sort();
      setAvailableSlots(finalSlots);
    }

    generateSlots();
  }, [selectedDoctor, selectedDate]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedDoctor) {
      setBookingError("Por favor, selecione o médico desejado.");
      return;
    }
    if (!selectedDate) {
      setBookingError("Por favor, informe a data da consulta.");
      return;
    }
    if (!selectedTime) {
      setBookingError("Por favor, selecione o horário da consulta.");
      return;
    }

    // Check if chosen date is in the past
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate < today) {
      setBookingError("Não é possível agendar consultas em datas passadas.");
      return;
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;

    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: currentUser.id,
        doctor_id: selectedDoctor,
        specialty_id: selectedSpecialty || null,
        location_id: selectedLocation || null,
        insurance_id: selectedInsurance || null,
        scheduled_at: scheduledAt,
        duration_min: 30,
        mode: selectedMode,
        status: "SCHEDULED",
        price: selectedInsurance ? 0 : 150.0,
        telemedicine_url: selectedMode === "TELEMEDICINE" ? `https://meet.medna.com.br/consulta-${Date.now()}` : null
      });

      if (error) throw error;

      setBookingSuccess("Consulta agendada com sucesso!");
      setSelectedTime("");
      await loadData();
      setActiveTab("appointments");
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Erro ao realizar agendamento.");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const reason = prompt("Informe o motivo do cancelamento:");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "CANCELED",
          cancel_reason: reason,
          canceled_at: new Date().toISOString(),
          canceled_by: currentUser?.id
        })
        .eq("id", appointmentId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Erro ao cancelar consulta.");
    }
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!newInsuranceId) {
      alert("Selecione a operadora do convênio.");
      return;
    }
    if (!newCardNumber || newCardNumber.trim().length < 5) {
      alert("Informe um número de carteirinha válido (mínimo 5 dígitos).");
      return;
    }

    try {
      const { error } = await supabase.from("patient_insurances").insert({
        patient_id: currentUser.id,
        insurance_id: newInsuranceId,
        card_number: newCardNumber.trim(),
        valid_until: newValidUntil || null,
        status: "ACTIVE"
      });

      if (error) throw error;

      setNewInsuranceId("");
      setNewCardNumber("");
      setNewValidUntil("");
      await loadData();
      alert("Carteirinha cadastrada com sucesso!");
    } catch (err: any) {
      console.error("Add insurance error:", err);
      alert("Erro ao cadastrar plano de saúde: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Área do Paciente
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Olá, {currentUser?.first_name}!
          </h2>
          <p className="text-sky-100 text-sm mt-1 max-w-xl">
            Gerencie suas consultas, agende novos horários e acompanhe seus planos de saúde e prontuários médicos.
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 mb-6 space-x-8">
        <button
          onClick={() => setActiveTab("book")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "book"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" /> Agendar Consulta
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" /> Minhas Consultas ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("insurances")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "insurances"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Planos & Convênios ({patientInsurances.length})
        </button>
      </div>

      {/* TAB 1: BOOK APPOINTMENT */}
      {activeTab === "book" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" /> Nova Consulta Virtual / Presencial
            </h3>

            {bookingSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {bookingSuccess}
              </div>
            )}

            {bookingError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-5">
              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  1. Selecione a Especialidade
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Todas as especialidades</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  2. Selecione o Médico
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Escolha um médico...</option>
                  {doctors.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      Dr(a). {d.user?.first_name || "Médico"} {d.user?.last_name || ""} — CRM {d.crm}/{d.crm_state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location & Insurance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    3. Local de Atendimento
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Hospital Central / Unidade Principal</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    4. Plano / Convênio
                  </label>
                  <select
                    value={selectedInsurance}
                    onChange={(e) => setSelectedInsurance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Particular (R$ 150,00)</option>
                    {patientInsurances.map((pi) => (
                      <option key={pi.id} value={pi.id}>
                        {pi.insurance?.name} ({pi.card_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendance Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  5. Modalidade de Consulta
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("IN_PERSON")}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                      selectedMode === "IN_PERSON"
                        ? "border-sky-600 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building className="w-4 h-4" /> Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("TELEMEDICINE")}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                      selectedMode === "TELEMEDICINE"
                        ? "border-sky-600 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Video className="w-4 h-4" /> Telemedicina
                  </button>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    6. Data da Consulta
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    7. Horário Disponível
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    disabled={availableSlots.length === 0}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {availableSlots.length > 0 ? "Selecione o horário..." : "Nenhum horário disponível"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} hs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Confirmar e Agendar Consulta
              </button>
            </form>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 text-sky-900">
              <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" /> Agenda Virtual Med.na
              </h4>
              <p className="text-xs text-sky-700 leading-relaxed">
                Nossa agenda em tempo real garante que seu horário seja reservado sem filas. Para consultas por telemedicina, você receberá o link direto na sua área de consultas.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-3">
                Seus Convênios Ativos
              </h4>
              {patientInsurances.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum plano cadastrado ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {patientInsurances.map((pi) => (
                    <li key={pi.id} className="text-xs font-medium text-slate-700 flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span>{pi.insurance?.name}</span>
                      <span className="font-mono text-slate-500">{pi.card_number}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Histórico de Agendamentos</h3>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Você ainda não possui consultas agendadas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((app) => {
                const isCanceled = app.status === "CANCELED";
                const isConfirmed = app.status === "CONFIRMED";
                const isCompleted = app.status === "COMPLETED";

                return (
                  <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isCanceled
                            ? "bg-red-100 text-red-700"
                            : isCompleted
                            ? "bg-slate-100 text-slate-700"
                            : isConfirmed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {app.status === "SCHEDULED" ? "Aguardando Confirmação" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                        </span>

                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          {app.mode === "TELEMEDICINE" ? <Video className="w-3.5 h-3.5 text-sky-600" /> : <Building className="w-3.5 h-3.5 text-slate-600" />}
                          {app.mode === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">
                        Dr(a). {app.doctor_user?.first_name || "Médico"} {app.doctor_user?.last_name || ""}
                      </h4>

                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(app.scheduled_at).toLocaleDateString("pt-BR")} às {new Date(app.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {app.specialty && (
                          <span className="flex items-center gap-1 font-medium text-sky-700">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {app.specialty.name}
                          </span>
                        )}
                        {app.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.location.name}
                          </span>
                        )}
                      </div>

                      {isCanceled && app.cancel_reason && (
                        <p className="text-xs text-red-600 mt-1">Motivo do cancelamento: {app.cancel_reason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {app.mode === "TELEMEDICINE" && app.telemedicine_url && !isCanceled && (
                        <a
                          href={app.telemedicine_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Video className="w-4 h-4" /> Entrar na Sala
                        </a>
                      )}

                      {!isCanceled && !isCompleted && (
                        <button
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSURANCES */}
      {activeTab === "insurances" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Seus Planos de Saúde</h3>

            {patientInsurances.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-slate-500 text-sm border border-slate-200">
                Você ainda não possui carteirinhas de planos de saúde vinculadas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patientInsurances.map((pi) => (
                  <div key={pi.id} className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-bold text-sky-400 text-sm">{pi.insurance?.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {pi.status}
                      </span>
                    </div>

                    <div className="font-mono text-lg tracking-wider font-semibold mb-4">
                      {pi.card_number}
                    </div>

                    <div className="text-[10px] text-slate-400 flex justify-between uppercase font-semibold">
                      <span>Validade</span>
                      <span>{pi.valid_until ? new Date(pi.valid_until).toLocaleDateString("pt-BR") : "Indefinida"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Insurance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
            <h4 className="font-bold text-slate-900 text-base mb-4">Adicionar Novo Convênio</h4>
            <form onSubmit={handleAddInsurance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Operadora
                </label>
                <select
                  value={newInsuranceId}
                  onChange={(e) => setNewInsuranceId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Selecione o plano...</option>
                  {allInsurances.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Número da Carteirinha
                </label>
                <input
                  type="text"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  placeholder="Ex: 889900112233"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Validade (opcional)
                </label>
                <input
                  type="date"
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Vincular Carteirinha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
