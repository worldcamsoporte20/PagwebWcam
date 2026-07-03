"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Cpu,
  CreditCard,
  FileText,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  Monitor,
  Percent,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  UserRound,
  Wifi,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { CART_UPDATED_EVENT, getCartTotals, readCart } from "../lib/cart";
import { SALES_DRAFT_UPDATED_EVENT, readSalesDraftItems } from "../lib/salesDraft";
import { SideMegaMenuButtonV2 } from "./SideMegaMenuButtonV2";

type ActivePage = "home" | "catalogo" | "promociones" | "carrito" | "ventas";
type NavItemKey = ActivePage | "nuevos" | "para-ti" | "cursos" | "cotizacion";
type AuthState = { email: string; initials: string; role: string } | null;

type NavItem = {
  label: string;
  href: string;
  icon: typeof HomeIcon;
  key: NavItemKey;
};

const navItems: NavItem[] = [
  { label: "Inicio", href: "/", icon: HomeIcon, key: "home" },
  { label: "Productos", href: "/catalogo", icon: LayoutGrid, key: "catalogo" },
  { label: "Nuevos", href: "/#nuevos", icon: Flame, key: "nuevos" },
  { label: "Para ti", href: "/#para-ti", icon: Sparkles, key: "para-ti" },
  { label: "Cursos", href: "/#eventos", icon: GraduationCap, key: "cursos" },
  { label: "Promociones", href: "/promociones", icon: Tag, key: "promociones" },
];

const categoryItems = [
  { label: "Seguridad", href: "/catalogo?categoria=seguridad", icon: ShieldCheck },
  { label: "Redes", href: "/catalogo?categoria=redes", icon: Wifi },
  { label: "Tecnología LED", href: "/catalogo?categoria=tecnologia-led", icon: Monitor },
  { label: "Computación", href: "/catalogo?categoria=computacion", icon: Cpu },
  { label: "Audio y Video", href: "/catalogo?categoria=audio-video", icon: Monitor },
  { label: "Telefonía", href: "/catalogo?categoria=telefonia", icon: Phone },
];

export default function SiteHeader({ active = "home" }: { active?: ActivePage }) {
  const [query, setQuery] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [auth, setAuth] = useState<AuthState>(null);
  const [cartQty, setCartQty] = useState(0);
  const [salesDraftQty, setSalesDraftQty] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("buscar") ?? "");
    const syncHash = () => setCurrentHash(window.location.hash.replace("#", ""));
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("wc_access_token");
    if (!token) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBaseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (response.status === 401) {
          localStorage.removeItem("wc_access_token");
          return null;
        }
        return response.ok ? response.json() : null;
      })
      .then((user: { email?: string; role?: string } | null) => {
        if (!user?.email) return;
        setAuth({
          email: user.email,
          initials: user.email[0].toUpperCase(),
          role: user.role ?? "customer",
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const syncCart = () => setCartQty(getCartTotals(readCart()).qty);
    syncCart();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    const syncSalesDraft = () => {
      setSalesDraftQty(readSalesDraftItems().reduce((sum, item) => sum + item.qty, 0));
    };

    syncSalesDraft();
    window.addEventListener(SALES_DRAFT_UPDATED_EVENT, syncSalesDraft);
    window.addEventListener("storage", syncSalesDraft);
    return () => {
      window.removeEventListener(SALES_DRAFT_UPDATED_EVENT, syncSalesDraft);
      window.removeEventListener("storage", syncSalesDraft);
    };
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    window.location.href = value ? `/catalogo?buscar=${encodeURIComponent(value)}` : "/catalogo";
  };

  const isStaff = auth?.role === "employee" || auth?.role === "admin";

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#022C96] text-[#FCFCFD] text-[11px]">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs sm:px-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-white" aria-hidden />
              Envíos a todo México
            </span>
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-white" aria-hidden />
              Hasta 12 MSI con tarjetas participantes
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5 text-white" aria-hidden />
              Compra hoy y recibe de 1 a 3 días hábiles
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href="/ayuda" className="underline decoration-white/70 hover:text-white">Ayuda</a>
            <a href="/sucursales" className="underline decoration-white/70 hover:text-white">Sucursales</a>
            <a href="/rastrea-tu-pedido" className="underline decoration-white/70 hover:text-white">Rastrea tu pedido</a>
          </div>
        </div>
      </div>

      <div className="bg-[#FCFCFD] shadow-sm">
        <div className="mx-auto flex w-full flex-wrap md:flex-nowrap items-center gap-3 justify-between px-3 py-1.5 sm:px-4 lg:px-6">
          <a href="/" aria-label="Ir a inicio" className="flex items-center gap-3 flex-none">
            <img src="/images/logo/logo.png" alt="Worldcam" className="h-24 w-auto sm:h-32 lg:h-36 xl:h-40" />
          </a>

          <div className="order-2 flex w-full flex-1 min-w-[240px] justify-center md:order-none">
            <form
              onSubmit={handleSearch}
              className="w-full max-w-3xl overflow-hidden rounded-full border border-[#1E49A2] bg-[#FCFCFD] text-[#12141A] shadow-sm"
            >
              <div className="flex h-12 items-center gap-3 px-4">
                <Search className="h-5 w-5 text-[#1E49A2]" aria-hidden />
                <input
                  className="h-full w-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#8F9BB3] sm:text-base"
                  placeholder="Buscar productos, categorías o marcas..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="order-3 flex items-center gap-2 md:ml-0 lg:ml-auto">
            {auth ? (
              <a
                href="/cuenta"
                aria-label="Mi cuenta"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] text-[#12141A] hover:bg-[#CBC9D4]/30 md:hidden"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#022C96] text-sm font-black text-[#FCFCFD]">
                  {auth.initials}
                </span>
              </a>
            ) : (
              <a
                href="/login"
                aria-label="Iniciar sesion"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] text-[#12141A] hover:bg-[#CBC9D4]/30 md:hidden"
              >
                <UserRound className="h-5 w-5" aria-hidden />
              </a>
            )}
            {auth ? (
              <a
                href="/cuenta"
                className="hidden items-center gap-2 rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] px-4 py-3 text-sm font-black text-[#12141A] hover:bg-[#CBC9D4]/30 md:flex lg:px-5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#022C96] text-sm font-black text-[#FCFCFD]">
                  {auth.initials}
                </span>
                <span className="hidden max-w-[120px] truncate lg:inline">{auth.email.split("@")[0]}</span>
              </a>
            ) : (
              <a
                className="hidden items-center gap-2 rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] px-4 py-3 text-sm font-black text-[#12141A] hover:bg-[#CBC9D4]/30 md:flex lg:px-5"
                href="/login"
              >
                <UserRound className="h-5 w-5" aria-hidden />
                <span className="hidden lg:inline">Ingresar</span>
              </a>
            )}
            <a
              href="/favoritos"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] text-[#12141A] hover:bg-[#CBC9D4]/30 md:hidden"
              aria-label="Favoritos"
            >
              <Heart className="h-6 w-6 text-[#1E49A2]" aria-hidden />
            </a>
            <a
              href="/favoritos"
              className="hidden h-11 items-center gap-2 rounded-2xl border border-[#CBC9D4] bg-[#FCFCFD] px-4 text-sm font-black text-[#12141A] hover:bg-[#CBC9D4]/30 md:flex lg:px-5"
            >
              <Heart className="h-5 w-5 text-[#1E49A2]" aria-hidden />
              <span className="hidden lg:inline">Favoritos</span>
            </a>
            {isStaff ? (
              <a
                href="/ventas"
                className="relative hidden items-center gap-1.5 rounded-2xl bg-[#1E49A2] px-4 py-3 text-sm font-black text-[#FCFCFD] hover:bg-[#2D70CF] lg:flex"
              >
                <FileText className="h-5 w-5" aria-hidden />
                <span>Orden</span>
                {salesDraftQty > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FCFCFD] px-1 text-[11px] font-black text-[#1E49A2]">
                    {salesDraftQty}
                  </span>
                ) : null}
              </a>
            ) : null}
            {!isStaff ? (
              <a
                className="relative flex items-center gap-2 rounded-2xl bg-[#022C96] px-4 py-3 text-sm font-black text-[#FCFCFD] hover:bg-[#2D70CF]"
                href="/carrito"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">Carrito</span>
                {cartQty > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-[#1E49A2]">
                    {cartQty}
                  </span>
                ) : null}
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#CBC9D4] bg-[#FCFCFD] w-full">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-center gap-2 px-3 py-1.5 sm:px-4 lg:px-6">
            <div className="w-64">
              <SideMegaMenuButtonV2 />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 overflow-x-auto pb-1">
              {categoryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group relative inline-flex h-12 min-w-[160px] items-center justify-center gap-1.5 overflow-hidden rounded-full border border-[#1E49A2]/55 bg-[#FCFCFD] px-3 text-sm font-black text-[#012477] shadow-sm transition-all duration-300 before:absolute before:inset-y-0 before:-left-10 before:w-8 before:skew-x-[-20deg] before:bg-white/35 before:opacity-0 before:transition-all before:duration-500 hover:-translate-y-1 hover:border-[#2D70CF] hover:bg-gradient-to-r hover:from-[#022C96] hover:via-[#1E49A2] hover:to-[#2D70CF] hover:text-white hover:shadow-[0_14px_30px_rgba(2,44,150,0.24),0_0_0_4px_rgba(45,112,207,0.12)] hover:before:left-[115%] hover:before:opacity-100"
                  >
                    <Icon className="h-5 w-5 text-[#012477] transition-colors duration-300 group-hover:text-white" aria-hidden />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {active !== "home" ? (
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-3 sm:px-4 lg:px-8 lg:pb-4">
          {[
            ...navItems,
            ...(auth && !isStaff ? [{ label: "Cotizacion", href: "/promociones#cotizacion", icon: FileText, key: "cotizacion" }] : []),
            ...(isStaff ? [{ label: "Ventas", href: "/ventas", icon: BarChart3, key: "ventas" }] : []),
          ].map((item) => {
            const Icon = item.icon;
            const isHashActive = currentHash && item.key === currentHash;
            const isActive = isHashActive || (!currentHash && item.key === active);

            return (
              <a
                key={item.label}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black transition sm:h-11 sm:px-4 ${
                  isActive ? "border border-[#1E49A2] bg-[#2D70CF]/10 text-[#012477]" : "text-[#12141A] hover:bg-[#CBC9D4]/50"
                }`}
                href={item.href}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
                {item.key === "ventas" && salesDraftQty > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[11px] font-black text-white">
                    {salesDraftQty}
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
