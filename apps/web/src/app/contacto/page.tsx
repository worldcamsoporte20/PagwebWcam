"use client";

import { FormEvent, useState } from "react";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    try {
      // Ejemplo: aquí puedes reemplazar con una llamada real a tu API
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50">
        <h1 className="text-3xl font-semibold mb-3">Contacto</h1>
        <p className="text-slate-600 mb-8">
          Completa el siguiente formulario y te responderemos a la brevedad.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Tu nombre"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Mensaje</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={6}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Escribe tu consulta aquí..."
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {status === "sending" ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ¡Mensaje enviado! Te contactaremos pronto.
          </p>
        )}

        {status === "error" && (
          <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Ocurrió un error al enviar el mensaje. Intenta nuevamente.
          </p>
        )}
      </div>
    </main>
  );
}
