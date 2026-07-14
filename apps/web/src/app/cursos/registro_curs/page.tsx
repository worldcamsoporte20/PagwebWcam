export type Registration = {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  createdAt: string;
};

const STORAGE_KEY = "wc_course_registrations";
export const REGISTRATIONS_UPDATED_EVENT = "wc-registrations-updated";

export function readRegistrations(): Registration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Registration[]) : [];
  } catch {
    return [];
  }
}

export function writeRegistrations(regs: Registration[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(regs));
  window.dispatchEvent(new Event(REGISTRATIONS_UPDATED_EVENT));
}

export function generateRegId() {
  return Math.random().toString(36).slice(2, 10);
}