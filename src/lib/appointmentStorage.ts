import { Appointment } from "@/types";

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
