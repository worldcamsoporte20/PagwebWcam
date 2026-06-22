"use client";

import { Building2, FileText, Lock, Mail, MapPin, Phone, User, UserPlus } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "Promociones", href: "/promociones" },
];

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de Mexico", "Coahuila", "Colima", "Durango", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "Mexico", "Michoacan", "Morelos", "Nayarit",
  "Nuevo Leon", "Oaxaca", "Puebla", "Queretaro", "Quintana Roo", "San Luis Potosi",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatan", "Zacatecas",
];

const fiscalRegimes = [
  "601 - General de Ley Personas Morales",
  "603 - Personas Morales con Fines no Lucrativos",
  "605 - Sueldos y Salarios e Ingresos Asimilados",
  "606 - Arrendamiento",
  "607 - Regimen de Enajenacion o Adquisicion de Bienes",
  "608 - Demas Ingresos",
  "610 - Residentes en el Extranjero sin Establecimiento Permanente",
  "611 - Ingresos por Dividendos",
  "612 - Personas Fisicas con Actividades Empresariales y Profesionales",
  "614 - Ingresos por Intereses",
  "615 - Regimen de los ingresos por obtencion de premios",
  "616 - Sin obligaciones fiscales",
  "620 - Sociedades Cooperativas de Produccion",
  "621 - Incorporacion Fiscal",
  "622 - Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras",
  "623 - Opcional para Grupos de Sociedades",
  "624 - Coordinados",
  "625 - Regimen de las Actividades Empresariales con ingresos a traves de Plataformas Tecnologicas",
  "626 - Regimen Simplificado de Confianza RESICO",
];

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  country: string;
  rfc: string;
  fiscalRegime: string;
};

type RegisterMode = "odoo" | "new";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-black uppercase text-steel dark:text-blue-100/70">
      {children}
      {required && <span className="ml-1 text-coral">*</span>}
    </label>
  );
}

function InputWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-slate-50 focus-within:border-blue-700 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-blue-400">
      {children}
    </div>
  );
}

function InputIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-slate-200 dark:border-white/10">
      {children}
    </div>
  );
}

const inputClass =
  "h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white dark:placeholder:text-white/30";
const selectClass =
  "h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white [&>option]:bg-white dark:[&>option]:bg-[#0d1526]";
const iconClass = "h-5 w-5 text-steel dark:text-blue-100/50";

function translateAuthMessage(message?: string) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("email already registered")) return "Este correo ya esta registrado";
  if (normalized.includes("invalid credentials")) return "Correo o contrasena incorrectos";
  if (normalized.includes("odoo partner not found")) return "La cuenta ya no existe o esta inactiva en Odoo";
  return message;
}

export default function RegistroPage() {
  const [mode, setMode] = useState<RegisterMode>("odoo");
  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", street: "", street2: "", city: "", state: "",
    country: "Mexico", rfc: "", fiscalRegime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const response = await fetch(`${apiBaseUrl}/api/auth/${mode === "odoo" ? "activate-odoo-account" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "odoo"
            ? {
                email: form.email,
                password: form.password,
              }
            : {
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone,
                street: form.street,
                street2: form.street2 || undefined,
                city: form.city,
                state: form.state,
                country: form.country,
                rfc: form.rfc || undefined,
                fiscalRegime: form.fiscalRegime || undefined,
              },
        ),
      });

      const data = (await response.json()) as { accessToken?: string; message?: string };

      if (!response.ok) {
        setError(translateAuthMessage(data.message) ?? (mode === "odoo" ? "No se pudo activar la cuenta de Odoo" : "No se pudo crear la cuenta"));
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
            <h1 className="mt-1 text-2xl font-black">Crear cuenta</h1>
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

      <section className="mx-auto max-w-2xl px-4 py-10 md:px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["odoo", "Ya tengo cuenta en Odoo", "Solo crea tu contrasena con tu correo registrado."],
                ["new", "Soy cliente nuevo", "Llena tus datos y creamos tu contacto en Odoo."],
              ].map(([key, title, text]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key as RegisterMode);
                    setError(null);
                  }}
                  className={`rounded-lg px-4 py-3 text-left transition ${
                    mode === key
                      ? "bg-blue-700 text-white"
                      : "bg-slate-50 text-ink hover:bg-slate-100 dark:bg-white/[0.04] dark:text-blue-100 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="block text-sm font-black">{title}</span>
                  <span className={`mt-1 block text-xs ${mode === key ? "text-blue-100" : "text-steel dark:text-blue-100/55"}`}>{text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Datos personales */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700/10">
                <User className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden />
              </div>
              <div>
                <h2 className="font-black dark:text-white">{mode === "odoo" ? "Activar acceso de cliente" : "Datos personales"}</h2>
                <p className="text-xs text-steel dark:text-blue-100/50">
                  {mode === "odoo" ? "Usa el correo que ya existe en Odoo y crea tu contrasena" : "Informacion de tu cuenta"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mode === "new" ? (
              <div className="md:col-span-2">
                <FieldLabel required>Nombre completo</FieldLabel>
                <InputWrapper>
                  <InputIcon><User className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" required placeholder="Juan Perez Lopez" value={form.name} onChange={set("name")} className={inputClass} />
                </InputWrapper>
              </div>
              ) : null}

              <div className="md:col-span-2">
                <FieldLabel required>Correo electronico</FieldLabel>
                <InputWrapper>
                  <InputIcon><Mail className={iconClass} aria-hidden /></InputIcon>
                  <input type="email" required placeholder="correo@empresa.com" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
                </InputWrapper>
              </div>

              <div>
                <FieldLabel required>Contrasena</FieldLabel>
                <InputWrapper>
                  <InputIcon><Lock className={iconClass} aria-hidden /></InputIcon>
                  <input type="password" required minLength={8} placeholder="Min. 8 caracteres" value={form.password} onChange={set("password")} className={inputClass} autoComplete="new-password" />
                </InputWrapper>
              </div>

              <div>
                <FieldLabel required>Confirmar contrasena</FieldLabel>
                <InputWrapper>
                  <InputIcon><Lock className={iconClass} aria-hidden /></InputIcon>
                  <input type="password" required placeholder="Repite tu contrasena" value={form.confirmPassword} onChange={set("confirmPassword")} className={inputClass} autoComplete="new-password" />
                </InputWrapper>
              </div>

              {mode === "new" ? (
              <div className="md:col-span-2">
                <FieldLabel required>Telefono</FieldLabel>
                <InputWrapper>
                  <InputIcon><Phone className={iconClass} aria-hidden /></InputIcon>
                  <input type="tel" required placeholder="221 653 1107" value={form.phone} onChange={set("phone")} className={inputClass} />
                </InputWrapper>
              </div>
              ) : null}
            </div>
          </div>

          {mode === "new" ? (
          <>
          {/* Direccion */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/10">
                <MapPin className="h-5 w-5 text-mint" aria-hidden />
              </div>
              <div>
                <h2 className="font-black dark:text-white">Direccion</h2>
                <p className="text-xs text-steel dark:text-blue-100/50">Para envios y facturacion</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel required>Calle y numero</FieldLabel>
                <InputWrapper>
                  <InputIcon><MapPin className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" required placeholder="Av. Insurgentes 123" value={form.street} onChange={set("street")} className={inputClass} />
                </InputWrapper>
              </div>

              <div className="md:col-span-2">
                <FieldLabel>Colonia / Referencia</FieldLabel>
                <InputWrapper>
                  <InputIcon><MapPin className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" placeholder="Col. Centro (opcional)" value={form.street2} onChange={set("street2")} className={inputClass} />
                </InputWrapper>
              </div>

              <div>
                <FieldLabel required>Ciudad</FieldLabel>
                <InputWrapper>
                  <InputIcon><Building2 className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" required placeholder="Puebla" value={form.city} onChange={set("city")} className={inputClass} />
                </InputWrapper>
              </div>

              <div>
                <FieldLabel required>Estado</FieldLabel>
                <InputWrapper>
                  <InputIcon><MapPin className={iconClass} aria-hidden /></InputIcon>
                  <select required value={form.state} onChange={set("state")} className={selectClass}>
                    <option value="">Selecciona estado</option>
                    {mexicanStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </InputWrapper>
              </div>

              <div className="md:col-span-2">
                <FieldLabel required>Pais</FieldLabel>
                <InputWrapper>
                  <InputIcon><Building2 className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" required placeholder="Mexico" value={form.country} onChange={set("country")} className={inputClass} />
                </InputWrapper>
              </div>
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                <FileText className="h-5 w-5 text-amber" aria-hidden />
              </div>
              <div>
                <h2 className="font-black dark:text-white">Datos fiscales</h2>
                <p className="text-xs text-steel dark:text-blue-100/50">Opcional — para emision de facturas</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>RFC</FieldLabel>
                <InputWrapper>
                  <InputIcon><FileText className={iconClass} aria-hidden /></InputIcon>
                  <input type="text" placeholder="XAXX010101000" maxLength={13} value={form.rfc} onChange={set("rfc")} className={`${inputClass} uppercase`} />
                </InputWrapper>
              </div>

              <div>
                <FieldLabel>Regimen fiscal</FieldLabel>
                <InputWrapper>
                  <InputIcon><FileText className={iconClass} aria-hidden /></InputIcon>
                  <select value={form.fiscalRegime} onChange={set("fiscalRegime")} className={selectClass}>
                    <option value="">Selecciona regimen</option>
                    {fiscalRegimes.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </InputWrapper>
              </div>
            </div>
          </div>
          </>
          ) : null}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-black uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <UserPlus className="h-5 w-5" aria-hidden />
            {loading ? (mode === "odoo" ? "Activando cuenta..." : "Creando cuenta...") : mode === "odoo" ? "Crear contrasena y entrar" : "Crear mi cuenta"}
          </button>

          <p className="text-center text-sm text-steel dark:text-blue-100/60">
            Ya tienes cuenta?{" "}
            <a href="/login" className="font-black text-blue-700 hover:underline dark:text-blue-400">
              Inicia sesion aqui
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
