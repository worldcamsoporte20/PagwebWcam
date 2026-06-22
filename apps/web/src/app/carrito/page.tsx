"use client";

import {
  BadgeCheck,
  CreditCard,
  LockKeyhole,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import {
  clearCart,
  EcommerceCartItem,
  getCartTotals,
  readCart,
  removeCartItem,
  updateCartItemQty,
} from "../../lib/cart";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

type CheckoutState = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  paymentMethod: "card" | "transfer" | "store";
};

const initialCheckout: CheckoutState = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "Puebla",
  paymentMethod: "card",
};

export default function CarritoPage() {
  const [items, setItems] = useState<EcommerceCartItem[]>([]);
  const [checkout, setCheckout] = useState<CheckoutState>(initialCheckout);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const totals = useMemo(() => getCartTotals(items), [items]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  function setQty(id: string, qty: number) {
    setItems(updateCartItemQty(id, qty));
  }

  function removeItem(id: string) {
    setItems(removeCartItem(id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;

    const number = `WC-${Date.now().toString().slice(-6)}`;
    setOrderNumber(number);
    clearCart();
    setItems([]);
  }

  return (
    <main className="min-h-screen bg-[#080d19] text-white">
      <SiteHeader active="carrito" />

      <section className="border-b border-white/10 bg-[#0b1020]">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam / Compra en linea</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-5xl">Carrito de compra</h1>
              <p className="mt-3 max-w-3xl text-blue-100/65">
                Revisa tus productos, confirma tus datos y realiza tu compra en linea con Worldcam.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <ShoppingCart className="h-7 w-7 text-mint" aria-hidden />
              <p className="mt-2 text-2xl font-black">{totals.qty} articulos</p>
              <p className="mt-1 text-xs font-black uppercase text-white/55">Carrito e-commerce</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-4">
          {orderNumber ? (
            <div className="rounded-lg border border-mint/30 bg-mint/10 p-8 text-center">
              <BadgeCheck className="mx-auto h-12 w-12 text-mint" aria-hidden />
              <h2 className="mt-4 text-3xl font-black">Compra recibida</h2>
              <p className="mt-2 text-blue-100/70">
                Orden demo <span className="font-black text-white">{orderNumber}</span>. La pasarela quedo lista para conectar proveedor real.
              </p>
              <a className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-blue-700 px-5 font-black text-white" href="/catalogo">
                Seguir comprando
              </a>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-10 text-center">
              <PackageSearch className="mx-auto h-12 w-12 text-blue-100/35" aria-hidden />
              <h2 className="mt-4 text-2xl font-black">Tu carrito esta vacio</h2>
              <p className="mt-2 text-blue-100/60">Agrega productos desde el catalogo para iniciar la compra.</p>
              <a className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-blue-700 px-5 font-black text-white" href="/catalogo">
                Ver productos
              </a>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-lg border border-white/10 bg-[#111827] p-4 md:grid-cols-[120px_1fr_auto]">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white/[0.04]">
                  {item.image ? (
                    <img className="h-full w-full object-contain" src={item.image} alt={item.name} />
                  ) : (
                    <PackageSearch className="h-10 w-10 text-blue-100/35" aria-hidden />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-mint">{item.brand}</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-black text-white">{item.name}</h2>
                  <p className="mt-2 text-sm text-blue-100/55">
                    SKU {item.sku} · Clave {item.clave}
                  </p>
                  <p className="mt-3 text-2xl font-black text-coral">{currency.format(item.price)}</p>
                </div>

                <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                  <div className="flex items-center rounded-lg border border-white/10 bg-[#080d19]">
                    <button className="flex h-10 w-10 items-center justify-center text-blue-100" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Quitar uno">
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="flex h-10 min-w-12 items-center justify-center font-black">{item.qty}</span>
                    <button className="flex h-10 w-10 items-center justify-center text-blue-100" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Agregar uno">
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <button className="flex h-10 items-center gap-2 rounded-lg border border-coral/30 px-3 text-sm font-black text-coral" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Quitar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#0d1324] p-5 lg:sticky lg:top-40">
          <h2 className="text-xl font-black">Resumen</h2>
          <div className="mt-5 space-y-3 text-sm text-blue-100/70">
            <div className="flex justify-between"><span>Subtotal</span><span>{currency.format(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA 16%</span><span>{currency.format(totals.tax)}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-2xl font-black text-white">
              <span>Total</span><span className="text-mint">{currency.format(totals.total)}</span>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3">
              <input className="h-12 rounded-lg border border-white/10 bg-[#080d19] px-4 outline-none focus:border-blue-400" required placeholder="Nombre completo" value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} />
              <input className="h-12 rounded-lg border border-white/10 bg-[#080d19] px-4 outline-none focus:border-blue-400" required type="email" placeholder="Correo" value={checkout.email} onChange={(event) => setCheckout({ ...checkout, email: event.target.value })} />
              <input className="h-12 rounded-lg border border-white/10 bg-[#080d19] px-4 outline-none focus:border-blue-400" required placeholder="Telefono" value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} />
              <input className="h-12 rounded-lg border border-white/10 bg-[#080d19] px-4 outline-none focus:border-blue-400" required placeholder="Direccion de entrega" value={checkout.street} onChange={(event) => setCheckout({ ...checkout, street: event.target.value })} />
            </div>

            <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-blue-300" aria-hidden />
                <h3 className="font-black">Pasarela de pago</h3>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  ["card", "Tarjeta bancaria"],
                  ["transfer", "Transferencia"],
                  ["store", "Pagar en tienda"],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-[#080d19] px-3 py-3 text-sm font-black">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-300" aria-hidden />
                      {label}
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={checkout.paymentMethod === value}
                      onChange={() => setCheckout({ ...checkout, paymentMethod: value as CheckoutState["paymentMethod"] })}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-blue-100/55">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden />
                Modo demo: no se guarda informacion bancaria. Aqui se conecta Stripe, Mercado Pago o terminal bancaria cuando tengas las llaves.
              </p>
            </div>

            <button
              className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={items.length === 0}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
              Pagar {items.length > 0 ? currency.format(totals.total) : ""}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
