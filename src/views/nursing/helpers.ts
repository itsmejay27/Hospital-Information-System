import { DutyShift, Patient, User } from "../../types";

/** Local date-time as "YYYY-MM-DD HH:mm" (sorts correctly as a string). */
export function nowStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function todayIso(date = new Date()): string {
  return nowStamp(date).slice(0, 10);
}

export function currentShift(date = new Date()): DutyShift {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Afternoon";
  return "Night";
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function staffLabel(user: User | null | undefined): string {
  if (!user) return "Unknown";
  return user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;
}

export interface NursingTabProps {
  user: User;
  patients: Patient[];
  /** "" means all patients */
  patientId: string;
}
