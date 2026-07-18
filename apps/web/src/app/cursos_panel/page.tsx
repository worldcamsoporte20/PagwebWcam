"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, CalendarDays, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Course,
  readCourses,
  writeCourses,
  generateId,
} from "@/app/lib_cur/courses";

const COURSE_TYPES = [
  "Curso online",
  "Taller practico",
  "Demo tecnica",
  "Integradores",
];

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateEs(isoDate: string) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = MONTHS_ES[month - 1] ?? "";
  return `${String(day).padStart(2, "0")} ${monthName}`;
}

const emptyForm = {
  title: "",
  isoDate: "",
  time: "",
  instructor: "",
  place: "",
  type: COURSE_TYPES[0],
};

export default function CursosPanelPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    setCourses(readCourses());
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !form.title.trim() ||
      !form.isoDate ||
      !form.time.trim() ||
      !form.instructor.trim() ||
      !form.place.trim()
    ) {
      setError("Completa todos los campos antes de guardar.");
      return;
    }

    const newCourse: Course = {
      id: generateId(),
      date: formatDateEs(form.isoDate),
      title: form.title.trim(),
      instructor: form.instructor.trim(),
      type: form.type,
      time: form.time.trim(),
      place: form.place.trim(),
    };


    // Guardar en el mismo orden en que se agregó (evita depender de isoDate inexistente en Course)
    const finalList = [...courses, newCourse];

    setCourses(finalList);
    writeCourses(finalList);
    setForm(emptyForm);
  }

  function handleDelete(id: string) {
    const updated = courses.filter((c) => c.id !== id);
    setCourses(updated);
    writeCourses(updated);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#080d19] lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/panel"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-blue-700 dark:text-blue-100/60 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al panel
        </Link>

        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Cursos y capacitaciones
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-blue-100/60">
          Agrega o elimina cursos. Los cambios se reflejan al instante en la
          página pública de Cursos.
        </p>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#0d1526]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Nombre del curso
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej. Certificacion Dahua WizSense"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Fecha
              </label>
              <input
                type="date"
                name="isoDate"
                value={form.isoDate}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Hora
              </label>
              <input
                type="text"
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="Ej. 10:00 AM"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Quien lo imparte
              </label>
              <input
                type="text"
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
                placeholder="Ej. Ing. Carlos Pérez"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Lugar
              </label>
              <input
                type="text"
                name="place"
                value={form.place}
                onChange={handleChange}
                placeholder="Ej. Puebla / Online"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                Tipo
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
              >
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm font-bold text-red-600 dark:text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar curso
          </button>
        </form>

        {/* Lista de cursos */}
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Cursos programados ({courses.length})
          </h2>

          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-[#0d1526]">
            {courses.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500 dark:text-blue-100/60">
                Aún no has agregado cursos.
              </p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 py-2 text-center dark:border-blue-400/20 dark:bg-blue-900/20">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {course.date.split(" ")[1] ?? ""}
                    </p>
                    <p className="text-xl font-black leading-none text-gray-900 dark:text-white">
                      {course.date.split(" ")[0]}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-blue-100/55">
                      {course.type} · {course.time} · {course.place} ·{" "}
                      {course.instructor}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(course.id)}
                    aria-label={`Eliminar ${course.title}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-coral/30 dark:text-coral dark:hover:bg-coral/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}