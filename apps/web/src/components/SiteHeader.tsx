"use client";

import { BarChart3, FileText, Flame, GraduationCap, Home, Menu, Search, ShoppingCart, Sparkles, Tag, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { CART_UPDATED_EVENT, getCartTotals, readCart } from "../lib/cart";
import { SALES_DRAFT_UPDATED_EVENT, readSalesDraftItems } from "../lib/salesDraft";

type ActivePage = "home" | "catalogo" | "promociones" | "carrito" | "ventas";
type AuthState = { email: string; initials: string; role: string } | null;

const navItems = [
  { label: "Inicio", href: "/", icon: Home, key: "home" },
  { label: "Productos", href: "/catalogo", icon: Menu, key: "catalogo" },
  { label: "Nuevos", href: "/#nuevos", icon: Flame, key: "nuevos" },
  { label: "Para ti", href: "/#para-ti", icon: Sparkles, key: "para-ti" },
  { label: "Cursos", href: "/#eventos", icon: GraduationCap, key: "cursos" },
  { label: "Promociones", href: "/promociones", icon: Tag, key: "promociones" },
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/95 text-white backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center gap-3 px-3 py-3 sm:px-4 md:grid-cols-[auto_1fr_auto] lg:grid-cols-[200px_1fr_auto] lg:gap-4 lg:px-8 lg:py-4">
        <a href="/" aria-label="Ir a inicio">
          <img src="/images/logo/logo.png" alt="Worldcam" className="h-11 w-auto sm:h-14 lg:h-24" />
        </a>

        <form
          onSubmit={handleSearch}
          className="order-3 col-span-2 flex h-10 min-w-0 items-center overflow-hidden rounded-lg border border-blue-400/30 bg-white/[0.04] text-blue-100 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/25 md:order-none md:col-span-1 lg:h-12"
        >
          <Search className="ml-3 h-4 w-4 shrink-0 text-blue-200 lg:ml-4 lg:h-5 lg:w-5" aria-hidden />
          <input
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-blue-200/55 lg:px-3 lg:text-base"
            placeholder="Buscar PTZ, NVR, camaras..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        <div className="flex items-center justify-end gap-2">
          {auth ? (
            <a
              href="/cuenta"
              aria-label="Mi cuenta"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/10 text-sm font-black text-blue-100 hover:bg-blue-500/20 md:hidden"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                {auth.initials}
              </span>
            </a>
          ) : (
            <a
              href="/login"
              aria-label="Iniciar sesion"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-blue-100 hover:bg-white/10 md:hidden"
            >
              <UserRound className="h-5 w-5" aria-hidden />
            </a>
          )}
          {auth ? (
            <a
              href="/cuenta"
              className="hidden h-10 items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 text-sm font-black text-blue-300 hover:bg-blue-500/20 md:flex lg:h-11 lg:px-4"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                {auth.initials}
              </span>
              <span className="hidden max-w-[100px] truncate lg:inline">{auth.email.split("@")[0]}</span>
            </a>
          ) : (
            <a
              className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-black text-blue-100 hover:bg-white/10 md:flex lg:h-11 lg:px-4"
              href="/login"
            >
              <UserRound className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden />
              <span className="hidden lg:inline">Iniciar sesion</span>
            </a>
          )}
          {isStaff ? (
            <a
              href="/ventas"
              className="relative flex h-10 items-center gap-1.5 rounded-lg bg-coral px-3 text-sm font-black text-white hover:bg-coral/90 lg:h-11 lg:px-4"
            >
              <FileText className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden />
              <span className="hidden sm:inline">Orden</span>
              {salesDraftQty > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-coral">
                  {salesDraftQty}
                </span>
              ) : null}
            </a>
          ) : null}
          {!isStaff ? (
            <a className="relative flex h-10 items-center gap-1.5 rounded-lg bg-coral px-3 text-sm font-black text-white lg:h-11 lg:gap-2 lg:px-4" href="/carrito">
              <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden />
              <span className="hidden sm:inline">Carrito</span>
              {cartQty > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-black text-white">
                  {cartQty}
                </span>
              ) : null}
            </a>
          ) : null}
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-3 sm:px-4 lg:px-8 lg:pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          ...navItems,
          ...(auth && !isStaff ? [{ label: "Cotizacion", href: "/promociones#cotizacion", icon: FileText, key: "cotizacion" }] : []),
          ...(isStaff ? [{ label: "Ventas", href: "/ventas", icon: BarChart3, key: "ventas" }] : []),
        ].map((item) => {
          const Icon = item.icon;
          const isHashActive = active === "home" && currentHash && item.key === currentHash;
          const isActive = isHashActive || (!currentHash && item.key === active);

          return (
            <a
              key={item.label}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black transition sm:h-11 sm:px-4 ${
                isActive
                  ? "border border-blue-400/60 bg-blue-700/30 text-blue-100"
                  : "text-white/85 hover:bg-white/10"
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
    </header>
  );
}
