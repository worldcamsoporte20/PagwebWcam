"use client";

import {
  Building2,
  Camera,
  Edit3,
  FileText,
  LogOut,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

type OdooProfile = {
  name?: string;
  phone?: string | false;
  street?: string | false;
  street2?: string | false;
  city?: string | false;
  state_id?: [number, string] | false;
  country_id?: [number, string] | false;
  vat?: string | false;
  l10n_mx_edi_fiscal_regime?: string | false;
};

type UserProfile = {
  id: string;
  email: string;
  role: string;
  odooPartnerId: number | null;
  odooProfile: OdooProfile | null;
};

type AccountOverrides = {
  name?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  vat?: string;
  l10n_mx_edi_fiscal_regime?: string;
};

type AccountPanel = "datos" | "foto" | "sesion";

const accountOverridesKey = "worldcam_account_overrides_v1";
const accountAvatarKey = "worldcam_account_avatar_v1";
const fiscalRegimes: Record<string, string> = {
  "601": "General de Ley Personas Morales",
  "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606": "Arrendamiento",
  "607": "Regimen de Enajenacion o Adquisicion de Bienes",
  "608": "Demas ingresos",
  "610": "Residentes en el Extranjero sin Establecimiento Permanente en Mexico",
  "611": "Ingresos por Dividendos",
  "612": "Personas Fisicas con Actividades Empresariales y Profesionales",
  "614": "Ingresos por intereses",
  "615": "Regimen de los ingresos por obtencion de premios",
  "616": "Sin obligaciones fiscales",
  "620": "Sociedades Cooperativas de Produccion que optan por diferir sus ingresos",
  "621": "Incorporacion Fiscal",
  "622": "Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras",
  "623": "Opcional para Grupos de Sociedades",
  "624": "Coordinados",
  "625": "Regimen de las Actividades Empresariales con ingresos a traves de Plataformas Tecnologicas",
  "626": "Regimen Simplificado de Confianza",
};

function fiscalRegimeLabel(value?: string | false | null): string {
  const code = str(value).trim();
  if (!code) return "";
  return fiscalRegimes[code] ? `${code} - ${fiscalRegimes[code]}` : code;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

function str(val?: string | false | null): string {
  return typeof val === "string" ? val : "";
}

function many2oneLabel(val?: [number, string] | false): string {
  return Array.isArray(val) ? val[1] : "";
}

function InfoRow({
  icon: Icon,
  label,
  value,
  empty = "No registrado",
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  empty?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700/10 dark:bg-white/5">
        <Icon className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase text-steel dark:text-blue-100/50">{label}</p>
        <p className={`mt-0.5 font-semibold ${value ? "text-ink dark:text-white" : "italic text-slate-400 dark:text-white/30"}`}>
          {value || empty}
        </p>
      </div>
    </div>
  );
}

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-coral/10 text-coral border border-coral/30" },
  employee: { label: "Empleado", color: "bg-blue-500/10 text-blue-300 border border-blue-400/30" },
  customer: { label: "Cliente", color: "bg-mint/10 text-mint border border-mint/30" },
};

const accountPanelOptions: Array<{ key: AccountPanel; label: string; icon: React.ElementType }> = [
  { key: "datos", label: "Datos", icon: Edit3 },
  { key: "foto", label: "Subir foto", icon: Camera },
  { key: "sesion", label: "Sesion", icon: LogOut },
];

export default function CuentaPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [overrides, setOverrides] = useState<AccountOverrides>({});
  const [editForm, setEditForm] = useState<AccountOverrides>({});
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activePanel, setActivePanel] = useState<AccountPanel>("datos");
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wc_access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem("wc_access_token");
          window.location.href = "/login";
          return;
        }
        const data = (await res.json()) as UserProfile;
        if (!data?.email) {
          window.location.href = "/login";
          return;
        }
        const storedAvatar = localStorage.getItem(accountAvatarKey) ?? "";
        localStorage.removeItem(accountOverridesKey);
        setOverrides({});
        setEditForm({
          name: str(data.odooProfile?.name) ?? "",
          phone: str(data.odooProfile?.phone) ?? "",
          street: str(data.odooProfile?.street) ?? "",
          street2: str(data.odooProfile?.street2) ?? "",
          city: str(data.odooProfile?.city) ?? "",
          vat: str(data.odooProfile?.vat) ?? "",
          l10n_mx_edi_fiscal_regime: str(data.odooProfile?.l10n_mx_edi_fiscal_regime) ?? "",
        });
        setAvatarUrl(storedAvatar);
        setProfile(data);
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("wc_access_token");
    window.location.href = "/";
  }

  async function saveAccountData() {
    const token = localStorage.getItem("wc_access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editForm),
    });

    if (response.status === 401) {
      localStorage.removeItem("wc_access_token");
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      setSavedMessage("No se pudo sincronizar con Odoo");
      window.setTimeout(() => setSavedMessage(""), 2200);
      return;
    }

    const updated = (await response.json()) as UserProfile;
    localStorage.removeItem(accountOverridesKey);
    setOverrides({});
    setProfile(updated);
    setEditForm({
      name: str(updated.odooProfile?.name) ?? "",
      phone: str(updated.odooProfile?.phone) ?? "",
      street: str(updated.odooProfile?.street) ?? "",
      street2: str(updated.odooProfile?.street2) ?? "",
      city: str(updated.odooProfile?.city) ?? "",
      vat: str(updated.odooProfile?.vat) ?? "",
      l10n_mx_edi_fiscal_regime: str(updated.odooProfile?.l10n_mx_edi_fiscal_regime) ?? "",
    });
    setSavedMessage("Datos sincronizados con Odoo");
    window.setTimeout(() => setSavedMessage(""), 1800);
  }

  function handlePhotoUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      localStorage.setItem(accountAvatarKey, value);
      setAvatarUrl(value);
      setSavedMessage("Foto actualizada");
      window.setTimeout(() => setSavedMessage(""), 1800);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    localStorage.removeItem(accountAvatarKey);
    setAvatarUrl("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#080d19]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
          <p className="font-black text-steel dark:text-blue-100/60">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const odoo = { ...(profile.odooProfile ?? {}), ...overrides };
  const name = str(odoo.name) || profile.email.split("@")[0];
  const initials = getInitials(str(odoo.name), profile.email);
  const role = roleConfig[profile.role] ?? { label: profile.role, color: "bg-slate-100 text-steel" };
  const canUseSales = profile.role === "employee" || profile.role === "admin";

  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-[#080d19] dark:text-white">
      {/* Header */}
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <a href="/" className="block">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam de Mexico</p>
            <h1 className="mt-1 text-2xl font-black">Mi cuenta</h1>
          </a>
          <nav className="flex flex-wrap gap-2">
            {[
              { label: "Home", href: "/" },
              { label: "Catalogo", href: "/catalogo" },
              { label: "Promociones", href: "/promociones" },
              ...(canUseSales ? [{ label: "Ventas", href: "/ventas" }] : []),
            ].map((item) => (
              <a key={item.href} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-black uppercase text-white hover:bg-white/15" href={item.href}>
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

      {/* Profile hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-2xl font-black text-white shadow-lg ring-4 ring-white/10">
                {avatarUrl ? (
                  <img className="h-full w-full object-cover" src={avatarUrl} alt={name} />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black md:text-3xl">{name}</h2>
                  <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${role.color}`}>
                    {role.label}
                  </span>
                </div>
                <p className="mt-1 text-white/60">{profile.email}</p>
                {profile.odooPartnerId && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-mint/80">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Sincronizado con Odoo · ID {profile.odooPartnerId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/catalogo"
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-600"
              >
                <PackageSearch className="h-4 w-4" aria-hidden />
                Ver catalogo
              </a>
              {!canUseSales ? (
                <a
                  href="/promociones#cotizacion"
                  className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-black text-ink hover:opacity-90"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Solicitar cotizacion
                </a>
              ) : null}
              {canUseSales ? (
                <a
                  href="/ventas"
                  className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-black text-white hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Ventas
                </a>
              ) : null}
              {!canUseSales ? (
                <a
                  href="/carrito"
                  className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-black text-white hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Carrito
                </a>
              ) : null}
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526] md:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-steel dark:text-blue-100/45">Opciones de cuenta</p>
              <h3 className="mt-1 text-xl font-black dark:text-white">Perfil, foto y sesion</h3>
              {savedMessage ? <p className="mt-2 text-sm font-bold text-mint">{savedMessage}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {accountPanelOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePanel(key)}
                  className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
                    activePanel === key
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-ink hover:bg-slate-200 dark:bg-white/[0.06] dark:text-blue-100 dark:hover:bg-white/[0.1]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activePanel === "datos" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ["name", "Nombre"],
                ["phone", "Telefono"],
                ["street", "Calle"],
                ["street2", "Colonia"],
                ["city", "Ciudad"],
                ["vat", "RFC"],
                ["l10n_mx_edi_fiscal_regime", "Regimen fiscal"],
              ].map(([field, label]) => (
                <label key={field} className="block">
                  <span className="text-xs font-black uppercase text-steel dark:text-blue-100/50">{label}</span>
                  {field === "l10n_mx_edi_fiscal_regime" ? (
                    <select
                      className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#08111f] dark:text-white"
                      value={String(editForm.l10n_mx_edi_fiscal_regime ?? "")}
                      onChange={(event) => setEditForm((current) => ({ ...current, l10n_mx_edi_fiscal_regime: event.target.value }))}
                    >
                      <option value="">Seleccionar regimen fiscal</option>
                      {Object.entries(fiscalRegimes).map(([code, label]) => (
                        <option key={code} value={code}>
                          {code} - {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#08111f] dark:text-white"
                      value={String(editForm[field as keyof AccountOverrides] ?? "")}
                      onChange={(event) => setEditForm((current) => ({ ...current, [field]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={saveAccountData}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 text-sm font-black text-ink transition hover:opacity-90"
                >
                  <Save className="h-4 w-4" aria-hidden />
                  Guardar cambios
                </button>
              </div>
            </div>
          ) : null}

          {activePanel === "foto" ? (
            <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-700 text-2xl font-black text-white ring-4 ring-blue-500/20">
                {avatarUrl ? <img className="h-full w-full object-cover" src={avatarUrl} alt={name} /> : initials}
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-600">
                  <Upload className="h-4 w-4" aria-hidden />
                  Subir foto
                  <input className="hidden" type="file" accept="image/*" onChange={(event) => handlePhotoUpload(event.target.files?.[0])} />
                </label>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="h-11 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-blue-100 transition hover:bg-white/[0.1]"
                >
                  Quitar foto
                </button>
              </div>
            </div>
          ) : null}

          {activePanel === "sesion" ? (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <p className="font-black text-red-300">Cerrar sesion</p>
              <p className="mt-1 text-sm text-red-100/70">Se eliminará el token local y volverás al inicio.</p>
              <button
                type="button"
                onClick={logout}
                className="mt-4 flex h-11 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-black text-white transition hover:bg-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesion
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526] md:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-steel dark:text-blue-100/45">
                {canUseSales ? "Modulo de empleado" : "Modulo de cliente"}
              </p>
              <h3 className="mt-1 text-xl font-black dark:text-white">
                {canUseSales ? "Ventas en tienda fisica y ordenes" : "Cotizaciones, compras y seguimiento"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-black">
              {canUseSales ? (
                <>
                  <a className="rounded-lg bg-blue-700 px-4 py-2 text-white" href="/ventas">Ventas</a>
                </>
              ) : (
                <>
                  <a className="rounded-lg bg-mint px-4 py-2 text-ink" href="/promociones#cotizacion">Cotizar</a>
                  <a className="rounded-lg bg-blue-700 px-4 py-2 text-white" href="/catalogo">Comprar</a>
                  <a className="rounded-lg bg-white/10 px-4 py-2 text-ink ring-1 ring-slate-200 dark:text-white dark:ring-white/10" href="/cuenta">Facturas</a>
                </>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(canUseSales
              ? [
                  ["Venta interna", "Selecciona cliente, revisa productos y registra operaciones desde el panel de ventas."],
                  ["Ordenes de venta", "Consulta operaciones internas y confirma ventas desde el panel de empleados."],
                  ["Acceso interno", "Solo empleados y administradores pueden entrar al modulo de ventas."],
                ]
              : [
                  ["Cotizacion asistida", "Solicita una propuesta con apoyo del asesor y productos reales del catalogo."],
                  ["Catalogo B2B/B2C", "Consulta productos, precios y promociones desde tu cuenta."],
                  ["Facturacion", "Tus datos fiscales quedan asociados a tu perfil para consultar documentos."],
                ]).map(([title, text]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="font-black dark:text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-steel dark:text-blue-100/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Datos personales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden />
            <h3 className="font-black dark:text-white">Datos personales</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <InfoRow icon={User} label="Nombre" value={str(odoo.name) || undefined} />
            <InfoRow icon={Mail} label="Correo" value={profile.email} />
            <InfoRow icon={Phone} label="Telefono" value={str(odoo.phone) || undefined} />
          </div>
        </div>

        {/* Dirección */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-mint" aria-hidden />
            <h3 className="font-black dark:text-white">Direccion</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <InfoRow icon={MapPin} label="Calle" value={str(odoo.street) || undefined} />
            <InfoRow icon={MapPin} label="Colonia" value={str(odoo.street2) || undefined} empty="No registrado" />
            <InfoRow icon={Building2} label="Ciudad" value={str(odoo.city) || undefined} />
            <InfoRow icon={MapPin} label="Estado" value={many2oneLabel(odoo.state_id) || undefined} />
            <InfoRow icon={Building2} label="Pais" value={many2oneLabel(odoo.country_id) || undefined} />
          </div>
        </div>

        {/* Datos fiscales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber" aria-hidden />
            <h3 className="font-black dark:text-white">Datos fiscales</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <InfoRow icon={Tag} label="RFC" value={str(odoo.vat) || undefined} empty="No registrado" />
            <InfoRow icon={FileText} label="Regimen fiscal" value={fiscalRegimeLabel(odoo.l10n_mx_edi_fiscal_regime) || undefined} empty="No registrado" />
          </div>

          {/* Account info */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/5">
            <div className="mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-steel dark:text-blue-100/50" aria-hidden />
              <p className="text-xs font-black uppercase text-steel dark:text-blue-100/50">Cuenta</p>
            </div>
            <div className="space-y-2 text-xs text-steel dark:text-blue-100/50">
              <p>ID: <span className="font-mono text-ink dark:text-white/70">{profile.id.slice(0, 8)}…</span></p>
              <p>Rol: <span className={`rounded px-2 py-0.5 text-xs font-black ${role.color}`}>{role.label}</span></p>
              {profile.odooPartnerId && (
                <p>Odoo Partner: <span className="font-mono text-ink dark:text-white/70">#{profile.odooPartnerId}</span></p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
