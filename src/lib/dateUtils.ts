/**
 * Utility functions for consistent formatting of appointment dates and times
 * without unexpected UTC/Timezone offset shifts.
 */

export function formatAppointmentDate(scheduledAt: string): string {
  if (!scheduledAt) return "";
  const datePart = scheduledAt.split(/[T ]/)[0];
  if (datePart && datePart.includes("-")) {
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }
  return new Date(scheduledAt).toLocaleDateString("pt-BR");
}

export function formatAppointmentTime(scheduledAt: string): string {
  if (!scheduledAt) return "";
  const parts = scheduledAt.split(/[T ]/);
  if (parts.length >= 2 && parts[1]) {
    const timePart = parts[1].substring(0, 5); // e.g. "15:30"
    if (timePart.includes(":")) {
      return timePart;
    }
  }
  return new Date(scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatAppointmentDateTime(scheduledAt: string): string {
  const dateStr = formatAppointmentDate(scheduledAt);
  const timeStr = formatAppointmentTime(scheduledAt);
  return `${dateStr} às ${timeStr}`;
}
