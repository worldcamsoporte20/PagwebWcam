"use client";

import { Eye, EyeOff, Lock, LogIn, Mail, Phone } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "Promociones", href: "/promociones" },
];

function translateAuthMessage(message?: string) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("email already registered")) return "Este correo ya esta registrado";
  if (normalized.includes("invalid credentials")) return "Correo o contrasena incorrectos";
  if (normalized.includes("odoo partner not found")) return "La cuenta ya no existe o esta inactiva en Odoo";
  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { accessToken?: string; message?: string };

      if (!response.ok) {
        setError(translateAuthMessage(data.message) ?? "Credenciales incorrectas");
        return;
      }

      if (data.accessToken) {
        localStorage.setItem("wc_access_token", data.accessToken);
        window.location.href = "/cuenta";
      }
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-[#080d19] dark:text-white">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <a href="/" className="block">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam de Mexico</p>
            <h1 className="mt-1 text-2xl font-black">Iniciar sesion</h1>
          </a>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-black uppercase text-white hover:bg-white/15"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Phone className="h-4 w-4 text-mint" aria-hidden />
            221 653 1107
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-12 md:px-0">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-700/10">
              <LogIn className="h-8 w-8 text-blue-700 dark:text-blue-400" aria-hidden />
            </div>
            <h2 className="mt-4 text-2xl font-black dark:text-white">Bienvenido de regreso</h2>
            <p className="mt-2 text-sm text-steel dark:text-blue-100/60">Ingresa con tu correo y contrasena</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black uppercase text-steel dark:text-blue-100/70">
                Correo electronico
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-slate-50 focus-within:border-blue-700 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-blue-400">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-slate-200 dark:border-white/10">
                  <Mail className="h-5 w-5 text-steel dark:text-blue-100/50" aria-hidden />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white dark:placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase text-steel dark:text-blue-100/70">
                Contrasena
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-slate-50 focus-within:border-blue-700 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-blue-400">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-slate-200 dark:border-white/10">
                  <Lock className="h-5 w-5 text-steel dark:text-blue-100/50" aria-hidden />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white dark:placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-steel hover:text-ink dark:text-blue-100/50 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 font-black uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" aria-hidden />
              {loading ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-steel dark:text-blue-100/60">
            No tienes cuenta?{" "}
            <a href="/registro" className="font-black text-blue-700 hover:underline dark:text-blue-400">
              Registrate aqui
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
