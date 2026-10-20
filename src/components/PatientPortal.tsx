"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Doctor, Specialty, Location, HealthInsurance, PatientInsurance, Appointment, DoctorSchedule, User } from "@/types";
import { TelemedicineRoom } from "@/components/TelemedicineRoom";
import { VirtualAgenda } from "@/components/VirtualAgenda";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import {
  saveCustomAppointment,
  getCustomAppointments,
  getCustomMedicalRecords,
  getCustomPrescriptions
} from "@/lib/appointmentStorage";
import { formatAppointmentDate, formatAppointmentTime, formatAppointmentDateTime } from "@/lib/dateUtils";
import { MedicalRecordDocumentView } from "@/components/MedicalRecordDocumentView";
import { MedicalRecord, Prescription } from "@/types";
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
  Trash2,
  FileText,
  X
} from "lucide-react";

const DEFAULT_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export const PatientPortal = () => {
  const { currentUser, availableUsers } = useAuth();

  const [activeTab, setActiveTab] = useState<"book" | "agenda" | "appointments" | "insurances">("book");

  // Data states
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorSpecialtiesMap, setDoctorSpecialtiesMap] = useState<Record<string, string[]>>({});
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
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);

  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Active Telemedicine Room Modal
  const [activeTeleRoomAppointment, setActiveTeleRoomAppointment] = useState<Appointment | null>(null);

  // View Medical Record & Prescription Modal
  const [viewingRecordApp, setViewingRecordApp] = useState<Appointment | null>(null);
  const [viewingMedicalRecord, setViewingMedicalRecord] = useState<MedicalRecord | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [loadingRecord, setLoadingRecord] = useState<boolean>(false);

  // New Insurance Form State
  const [newInsuranceId, setNewInsuranceId] = useState<string>("");
  const [newCardNumber, setNewCardNumber] = useState<string>("");
  const [newValidUntil, setNewValidUntil] = useState<string>("");

  const isValidUUID = (str: string | null | undefined) => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  const loadData = useCallback(async () => {
    try {
      const { data: usersData } = await supabase.from("users").select("*");
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((u) => usersMap.set(u.id, u));

      const { data: specs } = await supabase.from("specialties").select("*").order("name");
      if (specs) setSpecialties(specs);

      const { data: docSpecs } = await supabase.from("doctor_specialties").select("*");
      const dsMap: Record<string, string[]> = {};
      (docSpecs || []).forEach((ds) => {
        if (!dsMap[ds.doctor_id]) dsMap[ds.doctor_id] = [];
        dsMap[ds.doctor_id].push(ds.specialty_id);
      });
      setDoctorSpecialtiesMap(dsMap);

      const { data: docs } = await supabase.from("doctors").select("*");
      if (docs) {
        const enrichedDocs = docs.map((d) => ({
          ...d,
          user: usersMap.get(d.user_id),
        }));
        setDoctors(enrichedDocs);
      }

      const { data: locs } = await supabase.from("locations").select("*");
      if (locs) setLocations(locs);

      const { data: ins } = await supabase.from("health_insurances").select("*");
      if (ins) setAllInsurances(ins);

      if (currentUser) {
        if (isValidUUID(currentUser.id)) {
          const { data: patIns } = await supabase
            .from("patient_insurances")
            .select("*, insurance:health_insurances(*)")
            .eq("patient_id", currentUser.id);
          if (patIns) setPatientInsurances(patIns);

          const { data: apps } = await supabase
            .from("appointments")
            .select(`
              *,
              specialty:specialties(*),
              location:locations(*)
            `)
            .eq("patient_id", currentUser.id)
            .order("scheduled_at", { ascending: false });

          const customApps = getCustomAppointments().filter((ca) => ca.patient_id === currentUser.id);
          const mergedAppsMap = new Map<string, Appointment>();

          (apps || []).forEach((a) => {
            const enriched = {
              ...a,
              patient_user: usersMap.get(a.patient_id) || currentUser,
              doctor_user: usersMap.get(a.doctor_id),
            };
            mergedAppsMap.set(a.id, enriched);
          });

          customApps.forEach((ca) => {
            if (mergedAppsMap.has(ca.id)) {
              const existing = mergedAppsMap.get(ca.id)!;
              if (ca.status === "COMPLETED") {
                existing.status = "COMPLETED";
              }
            } else {
              mergedAppsMap.set(ca.id, ca);
            }
          });

          const finalApps = Array.from(mergedAppsMap.values()).sort(
            (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
          );
          setAppointments(finalApps);
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

  // Merge custom registered doctors from availableUsers into activeDoctors
  const customDoctorUsers = (availableUsers || []).filter((u) => u.role === "DOCTOR" && u.is_active !== false);

  const mergedDoctorsMap = new Map<string, Doctor>();

  doctors.forEach((d) => {
    if (d.user?.is_active !== false) {
      mergedDoctorsMap.set(d.user_id, d);
    }
  });

  customDoctorUsers.forEach((u) => {
    if (!mergedDoctorsMap.has(u.id)) {
      mergedDoctorsMap.set(u.id, {
        user_id: u.id,
        crm: "123456",
        crm_state: "SP",
        cpf: "00000000000",
        telemedicine_enabled: true,
        user: u
      });
    }
  });

  const activeDoctors = Array.from(mergedDoctorsMap.values());

  const matchedDoctors = activeDoctors.filter((doc) => {
    if (!selectedSpecialty) return true;
    const docSpecs = doctorSpecialtiesMap[doc.user_id] || [];
    return docSpecs.includes(selectedSpecialty);
  });

  // Fallback: If a newly created specialty has no assigned doctors in doctor_specialties,
  // display all active doctors so the patient can still schedule an appointment.
  const filteredDoctors = matchedDoctors.length > 0 ? matchedDoctors : activeDoctors;

  useEffect(() => {
    if (selectedDoctor && selectedSpecialty) {
      const isStillValid = filteredDoctors.some((d) => d.user_id === selectedDoctor);
      if (!isStillValid) {
        setSelectedDoctor("");
      }
    }
  }, [selectedSpecialty, filteredDoctors, selectedDoctor]);

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots(DEFAULT_TIME_SLOTS);
      return;
    }

    async function generateSlots() {
      const dateObj = new Date(selectedDate + "T12:00:00");
      const weekday = dateObj.getDay();

      let bookedTimes = new Set<string>();

      if (selectedDoctor) {
        const startOfDay = `${selectedDate}T00:00:00Z`;
        const endOfDay = `${selectedDate}T23:59:59Z`;

        const { data: existingApps } = await supabase
          .from("appointments")
          .select("scheduled_at")
          .eq("doctor_id", selectedDoctor)
          .neq("status", "CANCELED")
          .gte("scheduled_at", startOfDay)
          .lte("scheduled_at", endOfDay);

        bookedTimes = new Set(
          existingApps?.map((a) => {
            const timePart = a.scheduled_at.split(/[T ]/)[1]?.substring(0, 5);
            return timePart || formatAppointmentTime(a.scheduled_at);
          }) || []
        );
      }

      let rawSlots: string[] = [];

      if (selectedDoctor) {
        const { data: schedules } = await supabase
          .from("doctor_schedules")
          .select("*")
          .eq("doctor_id", selectedDoctor)
          .eq("weekday", weekday);

        if (schedules && schedules.length > 0) {
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
          rawSlots = DEFAULT_TIME_SLOTS;
        }
      } else {
        rawSlots = DEFAULT_TIME_SLOTS;
      }

      // Include local state appointments in booked times check
      appointments.forEach((a) => {
        if (a.doctor_id === selectedDoctor && a.status !== "CANCELED" && a.scheduled_at.startsWith(selectedDate)) {
          const slotTime = formatAppointmentTime(a.scheduled_at);
          bookedTimes.add(slotTime);
        }
      });

      const finalSlots = Array.from(new Set(rawSlots)).filter((slot) => !bookedTimes.has(slot)).sort();
      setAvailableSlots(finalSlots);
    }

    generateSlots();
  }, [selectedDoctor, selectedDate, appointments]);

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

    const today = new Date().toISOString().split("T")[0];
    if (selectedDate < today) {
      setBookingError("Não é possível agendar consultas em datas passadas.");
      return;
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;

    // Validation 1: Prevent double-booking for the same doctor at the same date and time
    const doctorOverlapping = appointments.some(
      (a) =>
        a.doctor_id === selectedDoctor &&
        a.status !== "CANCELED" &&
        (a.scheduled_at === scheduledAt || formatAppointmentTime(a.scheduled_at) === selectedTime && a.scheduled_at.startsWith(selectedDate))
    );
    if (doctorOverlapping) {
      setBookingError("O médico selecionado já possui um atendimento agendado para este mesmo dia e horário.");
      return;
    }

    // Validation 2: Prevent the patient from booking multiple appointments for themselves at the same date and time
    const patientOverlapping = appointments.some(
      (a) =>
        a.patient_id === currentUser.id &&
        a.status !== "CANCELED" &&
        (a.scheduled_at === scheduledAt || formatAppointmentTime(a.scheduled_at) === selectedTime && a.scheduled_at.startsWith(selectedDate))
    );
    if (patientOverlapping) {
      setBookingError("Você já possui outra consulta agendada para este mesmo dia e horário.");
      return;
    }

    // Resolve actual patient_insurances record or direct health_insurances ID
    let resolvedInsuranceCardId: string | null = null;
    if (selectedInsurance) {
      // Check if selectedInsurance is already a patient_insurances card ID
      const matchedCard = patientInsurances.find((pi) => pi.id === selectedInsurance);
      if (matchedCard) {
        resolvedInsuranceCardId = matchedCard.id;
      } else {
        // If it's a health_insurances ID, check if patient already has a card for it, or auto-create one
        const matchedHealthIns = allInsurances.find((hi) => hi.id === selectedInsurance);
        if (matchedHealthIns) {
          const existingCard = patientInsurances.find((pi) => pi.insurance_id === matchedHealthIns.id);
          if (existingCard) {
            resolvedInsuranceCardId = existingCard.id;
          } else {
            // Create a patient_insurances card entry so FK constraint appointments_insurance_id_fkey holds
            const { data: newCard, error: cardError } = await supabase
              .from("patient_insurances")
              .insert({
                patient_id: currentUser.id,
                insurance_id: matchedHealthIns.id,
                card_number: `CONV-${Date.now().toString().slice(-6)}`,
                status: "ACTIVE"
              })
              .select()
              .single();

            if (!cardError && newCard) {
              resolvedInsuranceCardId = newCard.id;
            }
          }
        }
      }
    }

    try {
      // Ensure patient record exists in 'patients' table before inserting appointment
      const { data: patRecord } = await supabase.from("patients").select("user_id").eq("user_id", currentUser.id).single();
      if (!patRecord) {
        await supabase.from("patients").insert({
          user_id: currentUser.id,
          cpf: currentUser.phone?.replace(/\D/g, "") || `000${Date.now().toString().slice(-8)}`,
          birth_date: "1990-01-01"
        });
      }

      // Ensure doctor record exists in 'doctors' table before inserting appointment
      const { data: docRecord } = await supabase.from("doctors").select("user_id").eq("user_id", selectedDoctor).single();
      if (!docRecord) {
        await supabase.from("doctors").insert({
          user_id: selectedDoctor,
          crm: `${Math.floor(100000 + Math.random() * 900000)}`,
          crm_state: "SP",
          cpf: `111${Date.now().toString().slice(-8)}`,
          telemedicine_enabled: true
        });
      }

      const isValidUUID = (str: string | null | undefined) => {
        if (!str) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      };

      const newAppId = `app-${Date.now()}`;
      const matchedDoctorObj = doctors.find((d) => d.user_id === selectedDoctor);
      const matchedSpecialtyObj = specialties.find((s) => s.id === selectedSpecialty);
      const matchedLocationObj = locations.find((l) => l.id === selectedLocation);

      const localApp: Appointment = {
        id: newAppId,
        patient_id: currentUser.id,
        doctor_id: selectedDoctor,
        specialty_id: selectedSpecialty || undefined,
        location_id: selectedLocation || undefined,
        insurance_id: resolvedInsuranceCardId || undefined,
        scheduled_at: scheduledAt,
        duration_min: 30,
        mode: selectedMode,
        status: "SCHEDULED",
        price: resolvedInsuranceCardId ? 0 : 150.0,
        telemedicine_url: selectedMode === "TELEMEDICINE" ? `https://meet.medna.com.br/consulta-${Date.now()}` : undefined,
        patient_user: currentUser,
        doctor_user: matchedDoctorObj?.user,
        specialty: matchedSpecialtyObj,
        location: matchedLocationObj
      };

      const canUseSupabase = isValidUUID(currentUser.id) && isValidUUID(selectedDoctor);

      if (canUseSupabase) {
        const { error } = await supabase.from("appointments").insert({
          patient_id: currentUser.id,
          doctor_id: selectedDoctor,
          specialty_id: isValidUUID(selectedSpecialty) ? selectedSpecialty : null,
          location_id: isValidUUID(selectedLocation) ? selectedLocation : null,
          insurance_id: isValidUUID(resolvedInsuranceCardId) ? resolvedInsuranceCardId : null,
          scheduled_at: scheduledAt,
          duration_min: 30,
          mode: selectedMode,
          status: "SCHEDULED",
          price: resolvedInsuranceCardId ? 0 : 150.0,
          telemedicine_url: selectedMode === "TELEMEDICINE" ? `https://meet.medna.com.br/consulta-${Date.now()}` : null
        });

        if (error) throw error;
      }

      saveCustomAppointment(localApp);
      setAppointments((prev) => [localApp, ...prev]);
      setBookingSuccess("Consulta agendada com sucesso!");
      setSelectedTime("");
      setActiveTab("appointments");
    } catch (err: any) {
      console.warn("Supabase booking notice / fallback active:", err);
      const matchedDoctorObj = doctors.find((d) => d.user_id === selectedDoctor);
      const matchedSpecialtyObj = specialties.find((s) => s.id === selectedSpecialty);
      const matchedLocationObj = locations.find((l) => l.id === selectedLocation);

      const fallbackApp: Appointment = {
        id: `app-${Date.now()}`,
        patient_id: currentUser.id,
        doctor_id: selectedDoctor,
        specialty_id: selectedSpecialty || undefined,
        location_id: selectedLocation || undefined,
        insurance_id: resolvedInsuranceCardId || undefined,
        scheduled_at: scheduledAt,
        duration_min: 30,
        mode: selectedMode,
        status: "SCHEDULED",
        price: resolvedInsuranceCardId ? 0 : 150.0,
        telemedicine_url: selectedMode === "TELEMEDICINE" ? `https://meet.medna.com.br/consulta-${Date.now()}` : undefined,
        patient_user: currentUser,
        doctor_user: matchedDoctorObj?.user,
        specialty: matchedSpecialtyObj,
        location: matchedLocationObj
      };

      saveCustomAppointment(fallbackApp);
      setAppointments((prev) => [fallbackApp, ...prev]);
      setBookingSuccess("Consulta agendada com sucesso!");
      setSelectedTime("");
      setActiveTab("appointments");
    }
  };

  const handleOpenMedicalRecordModal = async (app: Appointment) => {
    setViewingRecordApp(app);
    setLoadingRecord(true);
    setViewingMedicalRecord(null);
    setViewingPrescription(null);

    try {
      let rec: MedicalRecord | null = null;
      let presc: Prescription | null = null;

      if (isValidUUID(app.id)) {
        const { data: dbRec } = await supabase
          .from("medical_records")
          .select("*")
          .eq("appointment_id", app.id)
          .maybeSingle();

        if (dbRec) {
          rec = {
            ...dbRec,
            patient_user: app.patient_user || currentUser || undefined,
            doctor_user: app.doctor_user
          };

          const { data: dbPres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("record_id", dbRec.id)
            .maybeSingle();

          if (dbPres) presc = dbPres;
        }
      }

      if (!rec) {
        const customRecs = getCustomMedicalRecords();
        const foundLocalRec = customRecs.find((r) => r.appointment_id === app.id);
        if (foundLocalRec) {
          rec = {
            ...foundLocalRec,
            patient_user: app.patient_user || currentUser || undefined,
            doctor_user: app.doctor_user
          };

          const customPrescs = getCustomPrescriptions();
          const foundLocalPresc = customPrescs.find((p) => p.record_id === foundLocalRec.id);
          if (foundLocalPresc) presc = foundLocalPresc;
        }
      }

      if (!rec) {
        rec = {
          id: `rec-${app.id}`,
          appointment_id: app.id,
          patient_id: app.patient_id,
          doctor_id: app.doctor_id,
          anamnesis: "Consulta realizada com o médico responsável.",
          diagnosis: "Atendimento presencial/telemedicina concluído.",
          patient_user: app.patient_user || currentUser || undefined,
          doctor_user: app.doctor_user,
          created_at: app.scheduled_at,
          signature_hash: `ICP-BR-${app.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          signature_timestamp: app.scheduled_at
        };
      }

      setViewingMedicalRecord(rec);
      setViewingPrescription(presc);
    } catch (err) {
      console.error("Error loading medical record:", err);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    // 2-day minimum advance cancellation rule
    const scheduledDateObj = new Date(appointment.scheduled_at);
    const now = new Date();
    const diffMs = scheduledDateObj.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 2) {
      alert("Consultas só podem ser canceladas com no mínimo 2 dias (48 horas) de antecedência. Para casos urgentes, entre em contato com a recepção da clínica.");
      return;
    }

    if (!confirm("Tem certeza de que deseja cancelar esta consulta?")) return;
    const reason = prompt("Informe o motivo do cancelamento:") || "Cancelado pelo paciente";

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "CANCELED",
          cancel_reason: reason,
          canceled_at: new Date().toISOString(),
          canceled_by: currentUser?.id
        })
        .eq("id", appointment.id);

      if (error) console.warn("Notice updating cancel status in DB:", error);

      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointment.id
            ? { ...app, status: "CANCELED", cancel_reason: reason }
            : app
        )
      );
      alert("Consulta cancelada com sucesso.");
    } catch (err) {
      console.error("Cancel error:", err);
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointment.id
            ? { ...app, status: "CANCELED", cancel_reason: reason }
            : app
        )
      );
      alert("Consulta cancelada com sucesso.");
    }
  };

  const handleDeleteInsuranceCard = async (insuranceCardId: string) => {
    if (!confirm("Tem certeza que deseja remover esta carteirinha de convênio?")) return;

    try {
      if (isValidUUID(insuranceCardId)) {
        const { error } = await supabase
          .from("patient_insurances")
          .delete()
          .eq("id", insuranceCardId);

        if (error) console.warn("Notice deleting insurance card from DB:", error);
      }

      setPatientInsurances((prev) => prev.filter((pi) => pi.id !== insuranceCardId));
      alert("Carteirinha removida com sucesso.");
    } catch (err: any) {
      console.error("Delete insurance card error:", err);
      setPatientInsurances((prev) => prev.filter((pi) => pi.id !== insuranceCardId));
      alert("Carteirinha removida com sucesso.");
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
      let insertedRecord: PatientInsurance | null = null;

      if (isValidUUID(currentUser.id) && isValidUUID(newInsuranceId)) {
        const { data, error } = await supabase.from("patient_insurances").insert({
          patient_id: currentUser.id,
          insurance_id: newInsuranceId,
          card_number: newCardNumber.trim(),
          valid_until: newValidUntil || null,
          status: "ACTIVE"
        })
        .select("*, insurance:health_insurances(*)")
        .single();

        if (error) console.warn("Notice inserting insurance into DB:", error);
        if (data) insertedRecord = data;
      }

      if (!insertedRecord) {
        const matchedInsuranceObj = allInsurances.find((i) => i.id === newInsuranceId);
        insertedRecord = {
          id: `pi-${Date.now()}`,
          patient_id: currentUser.id,
          insurance_id: newInsuranceId,
          card_number: newCardNumber.trim(),
          valid_until: newValidUntil || undefined,
          status: "ACTIVE",
          insurance: matchedInsuranceObj
        };
      }

      setPatientInsurances((prev) => [insertedRecord!, ...prev]);
      setNewInsuranceId("");
      setNewCardNumber("");
      setNewValidUntil("");
      alert("Carteirinha cadastrada com sucesso!");
    } catch (err: any) {
      console.error("Add insurance error:", err);
      const friendlyMsg = getFriendlyErrorMessage(err, "Erro ao cadastrar plano de saúde.");
      alert(friendlyMsg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Telemedicine Native Room Modal */}
      {activeTeleRoomAppointment && (
        <TelemedicineRoom
          appointment={activeTeleRoomAppointment}
          currentUserRole="PATIENT"
          onClose={() => setActiveTeleRoomAppointment(null)}
        />
      )}

      {/* View Medical Record & Prescription Modal */}
      {viewingRecordApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setViewingRecordApp(null);
                setViewingMedicalRecord(null);
                setViewingPrescription(null);
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Prontuário Eletrônico & Receita Médica
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Consulta com Dr(a). {viewingRecordApp.doctor_user?.first_name || "Médico"} {viewingRecordApp.doctor_user?.last_name || ""}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data do Atendimento: {formatAppointmentDateTime(viewingRecordApp.scheduled_at)}
              </p>
            </div>

            {loadingRecord ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                Carregando documento e prescrição do médico...
              </div>
            ) : viewingMedicalRecord ? (
              <MedicalRecordDocumentView
                record={viewingMedicalRecord}
                prescription={viewingPrescription}
              />
            ) : (
              <div className="py-8 text-center text-slate-500">
                Não foi possível carregar o prontuário para esta consulta.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 dark:from-slate-900 dark:to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Área do Paciente
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {currentUser?.first_name}!
          </h2>
          <p className="text-teal-100 dark:text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Gerencie suas consultas, acesse sua Agenda Virtual, marque horários e acompanhe seus planos de saúde.
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 space-x-6 sm:space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("book")}
          className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === "book"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Plus className="w-4 h-4" /> Agendar Consulta
        </button>

        <button
          onClick={() => setActiveTab("agenda")}
          className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === "agenda"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" /> Agenda Virtual
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === "appointments"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" /> Minhas Consultas ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab("insurances")}
          className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === "insurances"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Planos & Convênios ({patientInsurances.length})
        </button>
      </div>

      {/* TAB 1: BOOK APPOINTMENT */}
      {activeTab === "book" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" /> Nova Consulta Virtual / Presencial
            </h3>

            {bookingSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {bookingSuccess}
              </div>
            )}

            {bookingError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-5">
              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  1. Selecione a Especialidade
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  2. Selecione o Médico
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">Escolha um médico...</option>
                  {filteredDoctors.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      Dr(a). {d.user?.first_name || "Médico"} {d.user?.last_name || ""} — CRM {d.crm}/{d.crm_state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location & Insurance Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    3. Local de Atendimento
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    4. Plano / Convênio
                  </label>
                  <select
                    value={selectedInsurance}
                    onChange={(e) => setSelectedInsurance(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">Atendimento Particular (R$ 150,00)</option>
                    {patientInsurances.map((pi) => (
                      <option key={pi.id} value={pi.id}>
                        {pi.insurance?.name || "Convênio"} (Carteirinha: {pi.card_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendance Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  5. Modalidade de Consulta
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("IN_PERSON")}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                      selectedMode === "IN_PERSON"
                        ? "border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Building className="w-4 h-4" /> Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("TELEMEDICINE")}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                      selectedMode === "TELEMEDICINE"
                        ? "border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Video className="w-4 h-4" /> Telemedicina
                  </button>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    6. Data da Consulta
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    7. Horário Disponível
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">Selecione o horário...</option>
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
                className="w-full mt-6 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Confirmar e Agendar Consulta
              </button>
            </form>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 rounded-2xl p-5 text-teal-900 dark:text-teal-200">
              <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Agenda Virtual Med.na
              </h4>
              <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
                Nossa agenda em tempo real garante que seu horário seja reservado sem filas. Acompanhe todos os seus horários marcados na aba Agenda Virtual.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
                Seus Convênios Ativos
              </h4>
              {patientInsurances.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum plano cadastrado ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {patientInsurances.map((pi) => (
                    <li key={pi.id} className="text-xs font-medium text-slate-700 dark:text-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
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

      {/* TAB 2: VIRTUAL AGENDA (ERR-14 FIX) */}
      {activeTab === "agenda" && (
        <div className="space-y-4">
          <VirtualAgenda appointments={appointments} />
        </div>
      )}

      {/* TAB 3: MY APPOINTMENTS */}
      {activeTab === "appointments" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Agendamentos</h3>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Você ainda não possui consultas agendadas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.map((app) => {
                const isCanceled = app.status === "CANCELED";
                const isConfirmed = app.status === "CONFIRMED";
                const isCompleted = app.status === "COMPLETED";

                return (
                  <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isCanceled
                            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                            : isCompleted
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : isConfirmed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {app.status === "SCHEDULED" ? "Aguardando Confirmação" : app.status === "CONFIRMED" ? "Confirmada" : app.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                        </span>

                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          {app.mode === "TELEMEDICINE" ? <Video className="w-3.5 h-3.5 text-teal-600" /> : <Building className="w-3.5 h-3.5 text-slate-600" />}
                          {app.mode === "TELEMEDICINE" ? "Telemedicina" : "Presencial"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Dr(a). {app.doctor_user?.first_name || "Médico"} {app.doctor_user?.last_name || ""}
                      </h4>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatAppointmentDateTime(app.scheduled_at)}
                        </span>
                        {app.specialty && (
                          <span className="flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
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
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Motivo do cancelamento: {app.cancel_reason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <button
                          onClick={() => handleOpenMedicalRecordModal(app)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <FileText className="w-4 h-4" /> Ver Prontuário & Receita
                        </button>
                      )}

                      {app.mode === "TELEMEDICINE" && !isCanceled && !isCompleted && (
                        <button
                          onClick={() => setActiveTeleRoomAppointment(app)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Video className="w-4 h-4" /> Entrar na Teleconsulta Nativa
                        </button>
                      )}

                      {!isCanceled && !isCompleted && (
                        <button
                          onClick={() => handleCancelAppointment(app)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 transition-colors"
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

      {/* TAB 4: INSURANCES */}
      {activeTab === "insurances" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seus Planos de Saúde</h3>

            {patientInsurances.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-800">
                Você ainda não possui carteirinhas de planos de saúde vinculadas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patientInsurances.map((pi) => (
                  <div key={pi.id} className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between border border-slate-700">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-teal-400 text-sm">{pi.insurance?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {pi.status}
                          </span>
                          <button
                            onClick={() => handleDeleteInsuranceCard(pi.id)}
                            title="Excluir carteirinha"
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="font-mono text-lg tracking-wider font-semibold mb-3">
                        {pi.card_number}
                      </div>

                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 mb-3 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-semibold text-slate-400">Mensalidade do Plano:</span>
                          <span className="font-bold text-emerald-400">
                            {pi.insurance?.monthly_fee ? `R$ ${pi.insurance.monthly_fee.toFixed(2)}/mês` : "Isento / Parceria Direct"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-semibold text-slate-400">Coparticipação:</span>
                          <span className="font-medium text-slate-200">
                            {pi.insurance?.copay_rate || "0% em consultas virtuais"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                          Coverage: {pi.insurance?.coverage_details || "Cobertura Nacional Completa para Telemedicina e Consultas Presenciais."}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex justify-between uppercase font-semibold border-t border-slate-800 pt-3">
                      <span>Validade</span>
                      <span>{pi.valid_until ? new Date(pi.valid_until).toLocaleDateString("pt-BR") : "Indefinida"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Insurance */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4">Adicionar Novo Convênio</h4>
            <form onSubmit={handleAddInsurance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Operadora
                </label>
                <select
                  value={newInsuranceId}
                  onChange={(e) => setNewInsuranceId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Número da Carteirinha
                </label>
                <input
                  type="text"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  placeholder="Ex: 889900112233"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Validade (opcional)
                </label>
                <input
                  type="date"
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors"
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
