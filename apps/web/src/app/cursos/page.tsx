"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3, GraduationCap, MapPin, Phone, UserRound, X, CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { COURSES_UPDATED_EVENT, Course, readCourses } from "@/app/lib_cur/courses";
import {
  Registration,
  readRegistrations,
  writeRegistrations,
  generateRegId,
} from "@/app/lib_cur/registrations";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  seller: "",
};

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sync = () => setCourses(readCourses());
    sync();
    window.addEventListener(COURSES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COURSES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function openModal(course: Course) {
    setSelectedCourse(course);
    setForm(emptyForm);
    setError("");
    setSuccess(false);
  }

  function closeModal() {
    setSelectedCourse(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.seller.trim()) {
      setError("Completa todos los campos para inscribirte.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (!selectedCourse) return;

    const newRegistration: Registration = {
      id: generateRegId(),
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      seller: form.seller.trim(),
      createdAt: new Date().toISOString(),
    };

    const existing = readRegistrations();
    writeRegistrations([...existing, newRegistration]);
    setSuccess(true);
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-[#080d19] dark:text-white">
      <SiteHeader active="cursos" />

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam Academy</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">Cursos y capacitaciones</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-blue-100/65">
              Agenda tecnica para instaladores, integradores y equipos de venta.
            </p>
          </div>
          
        </div>

        <div className="mx-auto max-w-4xl">
          <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
            <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5 dark:border-white/10 dark:from-blue-900/40 dark:to-[#0d1526]">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                <GraduationCap className="h-24 w-24 text-blue-400 dark:text-blue-300" aria-hidden />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Worldcam Academy</p>
              <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Agenda Técnica</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-blue-200/60">Capacitación profesional para instaladores e integradores</p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {courses.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500 dark:text-blue-100/60">
                  No hay cursos programados por el momento.
                </p>
              ) : (
                courses.map((course, index) => {
                  const typeColors: Record<string, string> = {
                    "Curso online": "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
                    "Taller practico": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
                    "Demo tecnica": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
                    "Integradores": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
                  };
                  const badgeClass = typeColors[course.type] ?? "bg-red-50 text-red-600 border-red-200 dark:bg-coral/20 dark:text-red-300 dark:border-coral/30";
                  return (
                    <article
                      key={course.id}
                      onClick={() => openModal(course)}
                      className="group flex cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 py-2 text-center dark:border-blue-400/20 dark:bg-blue-900/20">
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {course.date.split(" ")[1] ?? ""}
                        </p>
                        <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">
                          {course.date.split(" ")[0]}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${badgeClass}`}>
                            {course.type}
                          </span>
                          {index === 0 && (
                            <span className="flex items-center gap-1 rounded-md border border-coral/30 bg-coral/10 px-2 py-0.5 text-[10px] font-black uppercase text-coral">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
                              Próximo
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1.5 text-sm font-black leading-snug text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-200">
                          {course.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-blue-100/55">
                            <Clock3 className="h-3 w-3" aria-hidden />
                            {course.time}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-blue-100/55">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {course.place}
                          </span>
                          {course.instructor ? (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-blue-100/55">
                              <UserRound className="h-3 w-3" aria-hidden />
                              {course.instructor}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center">
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-coral dark:text-white/20" aria-hidden />
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 dark:border-white/10">
              <a href="/cursos" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-black text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20">
                <GraduationCap className="h-4 w-4" aria-hidden />
                Ver todos los cursos
              </a>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
      <a href="tel:2216531107" aria-label="Llamar a Worldcam" className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-soft">
        <Phone className="h-6 w-6" aria-hidden />
      </a>

      {/* Modal de inscripción */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-[#0d1526]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Inscripción
                </p>
                <h3 className="mt-1 text-lg font-black text-gray-900 dark:text-white">
                  {selectedCourse.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-blue-100/55">
                  {selectedCourse.date} · {selectedCourse.time}
                </p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:text-blue-100/50 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  ¡Inscripción registrada con éxito!
                </p>
                <button
                  onClick={closeModal}
                  className="mt-2 h-10 rounded-lg bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                    Nombre del usuario
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                    Correo
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tucorreo@ejemplo.com"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                    Número
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="222 123 4567"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500 dark:text-blue-100/60">
                    Nombre del vendedor
                  </label>
                  <input
                    type="text"
                    name="seller"
                    value={form.seller}
                    onChange={handleChange}
                    placeholder="Nombre de quien te atendió"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111a2c] dark:text-white"
                  />
                </div>

                {error && (
                  <p className="text-sm font-bold text-red-600 dark:text-coral">{error}</p>
                )}

                <button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-blue-700 text-sm font-black text-white transition hover:bg-blue-800"
                >
                  Confirmar inscripción
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
