export type Course = {
  id: string;
  date: string;
  title: string;
  instructor: string;
  type: string;
  time: string;
  place: string;
};

const STORAGE_KEY = "wc_courses";
export const COURSES_UPDATED_EVENT = "wc-courses-updated";

export const defaultCourses: Course[] = [
  {
    id: "1",
    date: "22 mayo",
    title: "Certificacion Dahua WizSense",
    instructor: "Ing. Carlos Pérez",
    type: "Curso online",
    time: "10:00 AM",
    place: "Worldcam Academy",
  },
  {
    id: "2",
    date: "28 mayo",
    title: "Diseno de proyectos CCTV IP",
    instructor: "Ing. Laura Gómez",
    type: "Taller practico",
    time: "4:00 PM",
    place: "Puebla",
  },
  {
    id: "3",
    date: "04 junio",
    title: "Configuracion de NVR y analiticos IA",
    instructor: "Ing. Marco Ruiz",
    type: "Demo tecnica",
    time: "12:00 PM",
    place: "En vivo",
  },
  {
    id: "4",
    date: "11 junio",
    title: "Redes PoE para videovigilancia",
    instructor: "Ing. Sofía Torres",
    type: "Integradores",
    time: "5:00 PM",
    place: "Online",
  },
];

export function readCourses(): Course[] {
  if (typeof window === "undefined") return defaultCourses;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCourses;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultCourses;
    return parsed as Course[];
  } catch {
    return defaultCourses;
  }
}

export function writeCourses(courses: Course[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  window.dispatchEvent(new Event(COURSES_UPDATED_EVENT));
  window.dispatchEvent(new Event("storage"));
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}