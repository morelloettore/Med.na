"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment, MedicalRecord, MedicationItem, Prescription, DoctorSchedule, User } from "@/types";
import { TelemedicineRoom } from "@/components/TelemedicineRoom";
import { VirtualAgenda } from "@/components/VirtualAgenda";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import { MedicalRecordDocumentView } from "@/components/MedicalRecordDocumentView";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Stethoscope,
  Video,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Building,
  AlertCircle,
  Users,
  Settings
} from "lucide-react";

export const DoctorPortal = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"appointments" | "agenda" | "schedules" | "patients">("appointments");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Active Telemedicine Modal
  const [activeTeleRoomAppointment, setActiveTeleRoomAppointment] = useState<Appointment | null>(null);

  // Medical Record Form State
  const [anamnesis, setAnamnesis] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: "", dosage: "", instructions: "" }
  ]);

  const [recordSaved, setRecordSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<MedicalRecord | null>(null);

  // Doctor Schedules / Shift Management (Roadmap #1 & #11)
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [newWeekday, setNewWeekday] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState<string>("08:00");
  const [newEndTime, setNewEndTime] = useState<string>("12:00");
  const [newSlotMin, setNewSlotMin] = useState<number>(30);

  const loadDoctorData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

      // 1. Fetch Appointments
      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          specialty:specialties(*),
          location:locations(*)
        `)
        .eq("doctor_id", currentUser.id)
        .order("scheduled_at", { ascending: true });

      if (data) {
        const enrichedApps = data.map((app) => ({
          ...app,
          patient_user: usersMap.get(app.patient_id),
          doctor_user: usersMap.get(app.doctor_id),
        }));
        setAppointments(enrichedApps);
      }

      // 2. Fetch Schedules
      const { data: scheds } = await supabase
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", currentUser.id);

      if (scheds) setSchedules(scheds);
    } catch (err) {
      console.error("Error loading doctor portal data:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    loadDoctorData();
  }, [currentUser, loadDoctorData]);

  const handleSelectAppointment = async (app: Appointment) => {
    setSelectedAppointment(app);
    setRecordSaved(false);
    setExistingRecord(null);
    setAnamnesis("");
    setDiagnosis("");
    setNotes("");
    setMedications([{ name: "", dosage: "", instructions: "" }]);

    const { data: rec } = await supabase
      .from("medical_records")
      .select("*")
      .eq("appointment_id", app.id)
      .maybeSingle();

    if (rec) {
      setExistingRecord(rec);
      setAnamnesis(rec.anamnesis || "");
      setDiagnosis(rec.diagnosis || "");
      setNotes(rec.notes || "");

      const { data: pres } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("record_id", rec.id)
        .maybeSingle();

      if (pres && pres.medications) {
        setMedications(pres.medications);
      }
    }
  };

  const handleAddMedicationRow = () => {
    setMedications([...medications, { name: "", dosage: "", instructions: "" }]);
  };

  const handleRemoveMedicationRow = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !currentUser) return;

    if (!anamnesis.trim()) {
      alert("Por favor, preencha a Anamnese do paciente.");
      return;
    }
    if (!diagnosis.trim()) {
      alert("Por favor, preencha o Diagnóstico / Conduta médica.");
      return;
    }

    setSaving(true);
    try {
      let recordId = existingRecord?.id;

      if (existingRecord) {
        await supabase
          .from("medical_records")
          .update({
            anamnesis,
            diagnosis,
            notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingRecord.id);
      } else {
        const { data: newRec, error: recErr } = await supabase
          .from("medical_records")
          .insert({
            appointment_id: selectedAppointment.id,
            patient_id: selectedAppointment.patient_id,
            doctor_id: currentUser.id,
            anamnesis,
            diagnosis,
            notes
          })
          .select()
          .single();

        if (recErr) throw recErr;
        recordId = newRec.id;
      }

      const validMeds = medications.filter((m) => m.name.trim() !== "");
      if (recordId && validMeds.length > 0) {
        await supabase.from("prescriptions").delete().eq("record_id", recordId);
        await supabase.from("prescriptions").insert({
          record_id: recordId,
          medications: validMeds
        });
      }

      await supabase
        .from("appointments")
        .update({ status: "COMPLETED" })
        .eq("id", selectedAppointment.id);

      setRecordSaved(true);
      await loadDoctorData();
    } catch (err: any) {
      console.error("Error saving medical record:", err);
      alert(getFriendlyErrorMessage(err, "Erro ao salvar prontuário."));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { error } = await supabase.from("doctor_schedules").insert({
        doctor_id: currentUser.id,
        weekday: newWeekday,
        start_time: newStartTime,
        end_time: newEndTime,
        slot_minutes: newSlotMin
      });

      if (error) throw error;
      await loadDoctorData();
      alert("Escala de atendimento cadastrada com sucesso!");
    } catch (err: any) {
      console.error("Error adding schedule:", err);
      alert(getFriendlyErrorMessage(err, "Erro ao adicionar escala."));
    }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm("Deseja remover este turno de atendimento?")) return;
    try {
      const { error } = await supabase.from("doctor_schedules").delete().eq("id", schedId);
      if (error) throw error;
      await loadDoctorData();
    } catch (err: any) {
      alert(getFriendlyErrorMessage(err, "Erro ao remover escala."));
    }
  };

  const WEEKDAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Telemedicine Room Modal */}
      {activeTeleRoomAppointment && (
        <TelemedicineRoom
          appointment={activeTeleRoomAppointment}
          currentUserRole="DOCTOR"
          onClose={() => setActiveTeleRoomAppointment(null)}
        />
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 dark:from-slate-900 dark:to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Portal do Médico
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Dr(a). {currentUser?.first_name} {currentUser?.last_name}
        </h2>
        <p className="text-emerald-100 dark:text-slate-300 text-sm mt-1 max-w-xl">
          Gerencie sua agenda de atendimentos, preencha prontuários eletrônicos com assinatura digital e configure suas escalas médicas.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 space-x-8">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Atendimentos ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("agenda")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "agenda"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" /> Agenda Virtual
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "schedules"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" /> Escalas & Horários ({schedules.length})
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS & MEDICAL RECORD */}
      {activeTab === "appointments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" /> Pacientes Agendados
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {appointments.length}
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Nenhuma consulta agendada para você.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                {appointments.map((app) => {
                  const isSelected = selectedAppointment?.id === app.id;
                  const isCompleted = app.status === "COMPLETED";
                  const isCanceled = app.status === "CANCELED";

                  return (
                    <button
                      key={app.id}
                      onClick={() => handleSelectAppointment(app)}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col gap-2 ${
                        isSelected ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {app.patient_user?.first_name || "Paciente"} {app.patient_user?.last_name || ""}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isCompleted ? "bg-emerald-100 text-emerald-800" : isCanceled ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {app.status === "SCHEDULED" ? "Agendada" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(app.scheduled_at).toLocaleDateString("pt-BR")} às {new Date(app.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          {app.mode === "TELEMEDICINE" ? <Video className="w-3.5 h-3.5 text-sky-600" /> : <Building className="w-3.5 h-3.5 text-slate-400" />}
                          {app.mode === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!selectedAppointment ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-200">Selecione uma consulta da lista para atender ou preencher o prontuário.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendimento em Andamento</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAppointment.patient_user?.first_name || "Paciente"} {selectedAppointment.patient_user?.last_name || ""}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Email: {selectedAppointment.patient_user?.email || "Não informado"} | Tel: {selectedAppointment.patient_user?.phone || "Não informado"}
                    </p>
                  </div>

                  {selectedAppointment.mode === "TELEMEDICINE" && (
                    <button
                      onClick={() => setActiveTeleRoomAppointment(selectedAppointment)}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm w-fit"
                    >
                      <Video className="w-4 h-4" /> Entrar na Teleconsulta Nativa
                    </button>
                  )}
                </div>

                {recordSaved && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Prontuário eletrônico salvo e assinado digitalmente com sucesso!
                  </div>
                )}

                <form onSubmit={handleSaveMedicalRecord} className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-emerald-600" /> 1. Anamnese & Queixa Principal *
                    </h4>
                    <textarea
                      rows={3}
                      value={anamnesis}
                      onChange={(e) => setAnamnesis(e.target.value)}
                      required
                      placeholder="Sintomas relatados pelo paciente, histórico..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-3">
                      <Stethoscope className="w-4 h-4 text-emerald-600" /> 2. Diagnóstico & Conduta *
                    </h4>
                    <textarea
                      rows={3}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                      placeholder="Hipótese diagnóstica, plano terapêutico..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Prescrição */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" /> 3. Emitir Prescrição Receita Médica
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddMedicationRow}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Medicamento
                      </button>
                    </div>

                    <div className="space-y-3">
                      {medications.map((med, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 items-center">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="Medicamento (Ex: Paracetamol)"
                              value={med.name}
                              onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-medium text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Dosagem (Ex: 500mg)"
                              value={med.dosage}
                              onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-medium text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="Instruções"
                              value={med.instructions}
                              onChange={(e) => handleMedicationChange(idx, "instructions", e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-medium text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="sm:col-span-1 text-center">
                            {medications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicationRow(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {saving ? "Salvando..." : "Finalizar Consulta & Salvar Prontuário"}
                  </button>
                </form>

                {/* Document View Sheet */}
                {existingRecord && (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <MedicalRecordDocumentView
                      record={existingRecord}
                      prescription={medications.length > 0 ? { id: "presc-1", record_id: existingRecord.id, medications, issued_at: new Date().toISOString() } : null}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VIRTUAL AGENDA */}
      {activeTab === "agenda" && (
        <VirtualAgenda onOpenTelemedicine={(app) => setActiveTeleRoomAppointment(app)} />
      )}

      {/* TAB 3: DOCTOR SCHEDULES / SHIFTS CONFIGURATION (Roadmap #1 & #11) */}
      {activeTab === "schedules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Seus Turnos de Atendimento Cadastrados</h3>
            </div>

            {schedules.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Nenhum turno ou horário cadastrado. Adicione seu horário para liberar slots na agenda dos pacientes.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {schedules.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {WEEKDAY_NAMES[s.weekday]}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Horário: {s.start_time.substring(0, 5)} às {s.end_time.substring(0, 5)} • Duração slot: {s.slot_minutes} min
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remover turno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4">Adicionar Turno de Atendimento</h4>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Dia da Semana</label>
                <select
                  value={newWeekday}
                  onChange={(e) => setNewWeekday(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-xs font-semibold"
                >
                  {WEEKDAY_NAMES.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Horário Início</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Horário Fim</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Duração da Consulta (minutos)</label>
                <select
                  value={newSlotMin}
                  onChange={(e) => setNewSlotMin(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value={20}>20 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Cadastrar Escala
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
