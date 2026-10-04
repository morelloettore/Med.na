"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment, MedicalRecord, MedicationItem, Prescription, User } from "@/types";
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
  AlertCircle
} from "lucide-react";

export const DoctorPortal = () => {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Medical Record Form
  const [anamnesis, setAnamnesis] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Prescription Form
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: "", dosage: "", instructions: "" }
  ]);

  const [recordSaved, setRecordSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<MedicalRecord | null>(null);

  const loadDoctorAppointments = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Fetch users map for joining
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

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
    } catch (err) {
      console.error("Error loading doctor appointments:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    loadDoctorAppointments();
  }, [currentUser, loadDoctorAppointments]);

  const handleSelectAppointment = async (app: Appointment) => {
    setSelectedAppointment(app);
    setRecordSaved(false);
    setExistingRecord(null);
    setAnamnesis("");
    setDiagnosis("");
    setNotes("");
    setMedications([{ name: "", dosage: "", instructions: "" }]);

    // Check if record already exists for this appointment
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

      // Load prescriptions
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
      // 1. Upsert Medical Record
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

      // 2. Save Prescription if medications exist
      const validMeds = medications.filter((m) => m.name.trim() !== "");
      if (recordId && validMeds.length > 0) {
        await supabase.from("prescriptions").delete().eq("record_id", recordId);
        await supabase.from("prescriptions").insert({
          record_id: recordId,
          medications: validMeds
        });
      }

      // 3. Mark appointment as COMPLETED
      await supabase
        .from("appointments")
        .update({ status: "COMPLETED" })
        .eq("id", selectedAppointment.id);

      setRecordSaved(true);
      await loadDoctorAppointments();
    } catch (err: any) {
      console.error("Error saving medical record:", err);
      alert("Erro ao salvar prontuário: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Portal do Médico
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Dr(a). {currentUser?.first_name} {currentUser?.last_name}
        </h2>
        <p className="text-emerald-100 text-sm mt-1 max-w-xl">
          Gerencie sua agenda de atendimentos, realize teleconsultas e preencha o prontuário eletrônico dos seus pacientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Appointments List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Consultas Agendadas
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {appointments.length}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Nenhuma consulta agendada para você até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {appointments.map((app) => {
                const isSelected = selectedAppointment?.id === app.id;
                const isCompleted = app.status === "COMPLETED";
                const isCanceled = app.status === "CANCELED";

                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectAppointment(app)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2 ${
                      isSelected ? "bg-emerald-50/60 border-l-4 border-emerald-600" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-900">
                        {app.patient_user?.first_name || "Paciente"} {app.patient_user?.last_name || ""}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isCompleted ? "bg-emerald-100 text-emerald-800" : isCanceled ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {app.status === "SCHEDULED" ? "Agendada" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
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

        {/* Right Column: Appointment Details & Prontuário */}
        <div className="lg:col-span-2">
          {!selectedAppointment ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Selecione uma consulta da lista para atender ou visualizar o prontuário.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              {/* Header Details */}
              <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendimento em Andamento</span>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedAppointment.patient_user?.first_name || "Paciente"} {selectedAppointment.patient_user?.last_name || ""}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email: {selectedAppointment.patient_user?.email || "Não informado"} | Tel: {selectedAppointment.patient_user?.phone || "Não informado"}
                  </p>
                </div>

                {selectedAppointment.mode === "TELEMEDICINE" && selectedAppointment.telemedicine_url && (
                  <a
                    href={selectedAppointment.telemedicine_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm w-fit"
                  >
                    <Video className="w-4 h-4" /> Entrar na Teleconsulta
                  </a>
                )}
              </div>

              {recordSaved && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Prontuário eletrônico e prescrição salvos com sucesso! Consulta concluída.
                </div>
              )}

              {/* Form Prontuário */}
              <form onSubmit={handleSaveMedicalRecord} className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-emerald-600" /> 1. Anamnese & Queixa Principal *
                  </h4>
                  <textarea
                    rows={3}
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    required
                    placeholder="Sintomas relatados pelo paciente, histórico da moléstia atual..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-emerald-600" /> 2. Diagnóstico & Conduta *
                  </h4>
                  <textarea
                    rows={3}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                    placeholder="Hipótese diagnóstica, exames solicitados, plano terapêutico..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-emerald-600" /> 3. Observações Médicas Adicionais (opcional)
                  </h4>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anotações internas do médico..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Prescrição Médica */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" /> 4. Emitir Prescrição Receita Médica
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
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 items-center">
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Medicamento (Ex: Paracetamol)"
                            value={med.name}
                            onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Dosagem (Ex: 500mg)"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Instruções (Ex: 1 comp de 8 em 8h por 5 dias)"
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(idx, "instructions", e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
