import { Appointment, MedicalRecord, Prescription } from "@/types";

export const getCustomAppointments = (): Appointment[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("medna_custom_appointments");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomAppointment = (app: Appointment) => {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomAppointments();
    const updated = [app, ...current.filter((a) => a.id !== app.id)];
    localStorage.setItem("medna_custom_appointments", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save custom appointment:", err);
  }
};

export const updateCustomAppointmentStatus = (appId: string, status: any, cancelReason?: string | null) => {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomAppointments();
    const updated = current.map((a) =>
      a.id === appId ? { ...a, status, cancel_reason: cancelReason || a.cancel_reason } : a
    );
    localStorage.setItem("medna_custom_appointments", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update custom appointment status:", err);
  }
};

// Custom Medical Records Storage
export const getCustomMedicalRecords = (): MedicalRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("medna_custom_medical_records");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomMedicalRecord = (record: MedicalRecord) => {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomMedicalRecords();
    const updated = [record, ...current.filter((r) => r.id !== record.id && r.appointment_id !== record.appointment_id)];
    localStorage.setItem("medna_custom_medical_records", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save custom medical record:", err);
  }
};

// Custom Prescriptions Storage
export const getCustomPrescriptions = (): Prescription[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("medna_custom_prescriptions");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomPrescription = (prescription: Prescription) => {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomPrescriptions();
    const updated = [prescription, ...current.filter((p) => p.id !== prescription.id && p.record_id !== prescription.record_id)];
    localStorage.setItem("medna_custom_prescriptions", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save custom prescription:", err);
  }
};
