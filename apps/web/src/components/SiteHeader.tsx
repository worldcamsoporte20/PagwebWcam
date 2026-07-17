"use client";
import {
  BarChart3,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  Phone,
  Moon,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { CART_UPDATED_EVENT, getCartTotals, readCart } from "../lib/cart";
import { SALES_DRAFT_UPDATED_EVENT, readSalesDraftItems } from "../lib/salesDraft";
import { SideMegaMenuButtonV2 } from "./SideMegaMenuButtonV2";

type ActivePage = "home" | "catalogo" | "promociones" | "carrito" | "ventas" | "cursos";
type NavItemKey = ActivePage | "nuevos" | "para-ti" | "cotizacion";
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
  { label: "Cursos", href: "/cursos", icon: GraduationCap, key: "cursos" },
  { label: "Promociones", href: "/promociones", icon: Tag, key: "promociones" },
];

const topbarActions = [
  { label: "Quiero ser distribuidor", href: "/distribuidor", icon: Truck },
  { label: "Sucursales", href: "/sucursales", icon: HomeIcon },
  { label: "Facturación", href: "/facturacion", icon: FileText },
];

export default function SiteHeader({ active = "home" }: { active?: ActivePage }) {
  const [query, setQuery] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [auth, setAuth] = useState<AuthState>(null);
  const [cartQty, setCartQty] = useState(0);
  const [salesDraftQty, setSalesDraftQty] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("wc-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
    document.documentElement.style.colorScheme = initialDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem("wc-theme", isDark ? "dark" : "light");
  }, [isDark]);

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

  const fullNavItems = [
    ...navItems,
    ...(auth && !isStaff
      ? [{ label: "Cotizacion", href: "/promociones#cotizacion", icon: FileText, key: "cotizacion" as NavItemKey }]
      : []),
    ...(isStaff ? [{ label: "Ventas", href: "/ventas", icon: BarChart3, key: "ventas" as NavItemKey }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 dark:bg-[#0d1526] dark:text-white">
      <div className="bg-[#022C96] text-[#FCFCFD] text-xs">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-xs sm:px-4 lg:px-6">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-0.5 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0">
            {topbarActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1E49A2] px-3 py-1.5 text-xs font-black text-[#FCFCFD] transition hover:bg-[#2D70CF]"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {action.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-[0_1px_0_rgba(2,44,150,0.08)] dark:bg-[#0d1526] dark:text-white">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 md:flex-nowrap lg:px-8">
          <a href="/" aria-label="Ir a inicio" className="flex h-14 flex-none items-center lg:h-20">
            <img src="/images/logo/logo.png" alt="Worldcam" className="h-11 w-auto object-contain sm:h-12 lg:h-20" />
          </a>

          <div className="order-2 flex w-full min-w-0 flex-1 justify-center md:order-none md:min-w-[340px]">
            <form
              onSubmit={handleSearch}
              className="w-full max-w-[760px] overflow-hidden rounded-full border border-[#CCD8F2] bg-[#F8FAFF] text-[#12141A] transition focus-within:border-[#1E49A2] focus-within:bg-white dark:border-white/10 dark:bg-[#0b1325] dark:text-white"
            >
              <div className="flex h-10 items-center gap-2 px-4 sm:h-11 sm:gap-3 sm:px-5">
                <Search className="h-5 w-5 text-[#1E49A2] dark:text-white" aria-hidden />
                <input
                  className="h-full w-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#8F9BB3] sm:text-base dark:text-white dark:placeholder:text-white/40"
                  placeholder="Buscar productos, categorias o marcas..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="order-3 flex min-w-0 flex-1 items-center justify-end gap-1.5 md:ml-0 md:flex-none lg:ml-auto">
            {auth ? (
              <a
                href="/cuenta"
                aria-label="Mi cuenta"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#12141A] transition hover:bg-[#F1F5FF] md:hidden dark:text-white dark:hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#022C96] text-sm font-black text-[#FCFCFD]">
                  {auth.initials}
                </span>
              </a>
            ) : (
              <a
                href="/login"
                aria-label="Iniciar sesion"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#12141A] transition hover:bg-[#F1F5FF] md:hidden dark:text-white dark:hover:bg-white/10"
              >
                <UserRound className="h-5 w-5" aria-hidden />
              </a>
            )}
            {auth ? (
              <a
                href="/cuenta"
                className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-black text-[#12141A] transition hover:bg-[#F1F5FF] md:flex lg:px-4 dark:text-white dark:hover:bg-white/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#022C96] text-sm font-black text-[#FCFCFD]">
                  {auth.initials}
                </span>
                <span className="hidden max-w-[120px] truncate lg:inline">{auth.email.split("@")[0]}</span>
              </a>
            ) : (
              <a
                className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-black text-[#12141A] transition hover:bg-[#F1F5FF] md:flex lg:px-4 dark:text-white dark:hover:bg-white/10"
                href="/login"
              >
                <UserRound className="h-5 w-5" aria-hidden />
                <span className="hidden lg:inline">Ingresar</span>
              </a>
            )}
            <a
              href="/favoritos"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#12141A] transition hover:bg-[#F1F5FF] md:hidden dark:text-white dark:hover:bg-white/10"
              aria-label="Favoritos"
            >
              <Heart className="h-6 w-6 text-[#1E49A2] dark:text-white" aria-hidden />
            </a>
            <a
              href="/favoritos"
              className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-black text-[#12141A] transition hover:bg-[#F1F5FF] md:flex lg:px-4 dark:text-white dark:hover:bg-white/10"
            >
              <Heart className="h-5 w-5 text-[#1E49A2] dark:text-white" aria-hidden />
              <span className="hidden lg:inline">Favoritos</span>
            </a>
            {isStaff ? (
              <a
                href="/ventas"
                className="relative hidden h-10 items-center gap-1.5 rounded-full bg-[#1E49A2] px-4 text-sm font-black text-[#FCFCFD] transition hover:bg-[#2D70CF] lg:flex"
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
                className="relative flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#022C96] px-3 text-sm font-black text-[#FCFCFD] transition hover:bg-[#2D70CF] sm:px-4"
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

        {/* Nav principal: Todas las categorias + Inicio, Productos, Nuevos, Para ti, Cursos, Promociones */}
        <nav className="border-t border-[#CBC9D4] bg-[#FCFCFD] w-full dark:border-white/10 dark:bg-[#0d1526]">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-center gap-2 px-3 py-2 sm:px-4 lg:px-6">
            <div className="shrink-0">
              <SideMegaMenuButtonV2 />
            </div>

            {fullNavItems.map((item) => {
              const Icon = item.icon;
              const isHashActive = currentHash && item.key === currentHash;
              const isActive = isHashActive || (!currentHash && item.key === active);

              return (
                <a
                  key={item.label}
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-black transition ${
                    isActive
                      ? "border-[#1E49A2] bg-[#2D70CF]/10 text-[#012477] dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200"
                      : "border-[#1E49A2] bg-[#FCFCFD] text-[#12141A] hover:bg-[#CBC9D4]/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10"
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

            <button
              type="button"
              onClick={() => setIsDark((value) => !value)}
              className="order-3 flex h-10 shrink-0 items-center gap-2 rounded-full px-1.5 text-sm font-black text-[#12141A] transition hover:bg-[#F1F5FF] dark:text-white dark:hover:bg-white/10"
              aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              aria-pressed={isDark}
            >
              <span className="hidden sm:inline">{isDark ? "Oscuro" : "Claro"}</span>
              <span
                className={`relative inline-flex h-7 w-13 items-center rounded-full border p-0.5 transition ${
                  isDark ? "border-[#1E49A2] bg-[#022C96]" : "border-[#CCD8F2] bg-[#EEF4FF]"
                }`}
              >
                <span
                  className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1E49A2] shadow-sm transition ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isDark ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}
                </span>
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}