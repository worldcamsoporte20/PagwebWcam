"use client";

import {
  BadgeCheck,
  CreditCard,
  LockKeyhole,
  MapPin,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
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
    <main className="min-h-screen bg-[#ededed] text-[#333333]">
      <SiteHeader active="carrito" />

      <section className="border-b border-[#f5d328] bg-[#fff159]">
        <div className="mx-auto max-w-7xl px-4 py-7 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6b5c00]">Worldcam / Compra en linea</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#333333] md:text-5xl">Carrito de compra</h1>
              <p className="mt-3 max-w-3xl text-[#5f5600]">
                Revisa tus productos, confirma tus datos y compra en linea con una experiencia mas simple.
              </p>
            </div>
            <div className="rounded-lg border border-[#e3cb21] bg-white/70 p-4 shadow-sm">
              <ShoppingCart className="h-7 w-7 text-[#3483fa]" aria-hidden />
              <p className="mt-2 text-2xl font-black text-[#333333]">{totals.qty} articulos</p>
              <p className="mt-1 text-xs font-black uppercase text-[#777777]">Carrito e-commerce</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-4">
          {orderNumber ? (
            <div className="rounded-lg border border-[#00a650]/25 bg-white p-8 text-center shadow-sm">
              <BadgeCheck className="mx-auto h-12 w-12 text-[#00a650]" aria-hidden />
              <h2 className="mt-4 text-3xl font-black text-[#333333]">Compra recibida</h2>
              <p className="mt-2 text-[#666666]">
                Orden demo <span className="font-black text-[#333333]">{orderNumber}</span>. La pasarela quedo lista para conectar proveedor real.
              </p>
              <a className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#3483fa] px-5 font-black text-white transition hover:bg-[#2968c8]" href="/catalogo">
                Seguir comprando
              </a>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg bg-white p-10 text-center shadow-sm">
              <PackageSearch className="mx-auto h-12 w-12 text-[#999999]" aria-hidden />
              <h2 className="mt-4 text-2xl font-black text-[#333333]">Tu carrito esta vacio</h2>
              <p className="mt-2 text-[#666666]">Agrega productos desde el catalogo para iniciar la compra.</p>
              <a className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#3483fa] px-5 font-black text-white transition hover:bg-[#2968c8]" href="/catalogo">
                Ver productos
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#333333]">Productos</h2>
                  <p className="mt-1 text-sm text-[#666666]">{totals.qty} articulos en tu carrito</p>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-[#e6f7ee] px-3 py-2 text-sm font-bold text-[#00a650]">
                  <Truck className="h-4 w-4" aria-hidden />
                  Envio disponible
                </div>
              </div>

              {items.map((item) => (
                <article key={item.id} className="grid gap-4 border-b border-[#eeeeee] p-5 last:border-b-0 md:grid-cols-[112px_1fr_150px]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-[#eeeeee] bg-white">
                    {item.image ? (
                      <img className="h-full w-full object-contain p-2" src={item.image} alt={item.name} />
                    ) : (
                      <PackageSearch className="h-10 w-10 text-[#b5b5b5]" aria-hidden />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-[#3483fa]">{item.brand}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-[#333333]">{item.name}</h3>
                    <p className="mt-2 text-sm text-[#777777]">
                      SKU {item.sku} | Clave {item.clave}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-9 items-center overflow-hidden rounded-md border border-[#dddddd] bg-white">
                        <button className="flex h-9 w-9 items-center justify-center text-[#3483fa] transition hover:bg-[#f5f5f5]" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Quitar uno">
                          <Minus className="h-4 w-4" aria-hidden />
                        </button>
                        <span className="flex h-9 min-w-11 items-center justify-center border-x border-[#eeeeee] text-sm font-black">{item.qty}</span>
                        <button className="flex h-9 w-9 items-center justify-center text-[#3483fa] transition hover:bg-[#f5f5f5]" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Agregar uno">
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <button className="inline-flex items-center gap-2 text-sm font-bold text-[#3483fa] transition hover:text-[#2968c8]" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 md:block md:text-right">
                    <p className="text-2xl font-normal text-[#333333]">{currency.format(item.price)}</p>
                    <p className="mt-1 text-sm font-bold text-[#00a650]">Envio a cotizar</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg bg-white p-5 shadow-sm lg:sticky lg:top-40">
          <h2 className="text-xl font-black text-[#333333]">Resumen de compra</h2>
          <div className="mt-5 space-y-3 text-sm text-[#666666]">
            <div className="flex justify-between"><span>Productos ({totals.qty})</span><span>{currency.format(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA 16%</span><span>{currency.format(totals.tax)}</span></div>
            <div className="flex justify-between"><span>Envio</span><span className="font-bold text-[#00a650]">A cotizar</span></div>
            <div className="flex justify-between border-t border-[#eeeeee] pt-4 text-2xl font-normal text-[#333333]">
              <span>Total</span><span>{currency.format(totals.total)}</span>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-md border border-[#e7e7e7] bg-[#f8f8f8] p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#3483fa]" aria-hidden />
                <div>
                  <h3 className="font-black text-[#333333]">Datos de entrega</h3>
                  <p className="mt-1 text-sm text-[#666666]">Completa tus datos para preparar la cotizacion y envio.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <input className="h-12 rounded-md border border-[#dddddd] bg-white px-4 text-[#333333] outline-none transition placeholder:text-[#999999] focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/15" required placeholder="Nombre completo" value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} />
              <input className="h-12 rounded-md border border-[#dddddd] bg-white px-4 text-[#333333] outline-none transition placeholder:text-[#999999] focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/15" required type="email" placeholder="Correo" value={checkout.email} onChange={(event) => setCheckout({ ...checkout, email: event.target.value })} />
              <input className="h-12 rounded-md border border-[#dddddd] bg-white px-4 text-[#333333] outline-none transition placeholder:text-[#999999] focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/15" required placeholder="Telefono" value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} />
              <input className="h-12 rounded-md border border-[#dddddd] bg-white px-4 text-[#333333] outline-none transition placeholder:text-[#999999] focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/15" required placeholder="Direccion de entrega" value={checkout.street} onChange={(event) => setCheckout({ ...checkout, street: event.target.value })} />
            </div>

            <div className="rounded-md border border-[#e7e7e7] bg-white p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-[#3483fa]" aria-hidden />
                <h3 className="font-black text-[#333333]">Metodo de pago</h3>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  ["card", "Tarjeta bancaria"],
                  ["transfer", "Transferencia"],
                  ["store", "Pagar en tienda"],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center justify-between rounded-md border border-[#eeeeee] bg-[#f8f8f8] px-3 py-3 text-sm font-black text-[#333333] transition hover:border-[#3483fa]/40 hover:bg-white">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#3483fa]" aria-hidden />
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
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#666666]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00a650]" aria-hidden />
                Modo demo: no se guarda informacion bancaria. Aqui se conecta Stripe, Mercado Pago o terminal bancaria cuando tengas las llaves.
              </p>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3483fa] px-4 py-4 text-lg font-black text-white transition hover:bg-[#2968c8] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={items.length === 0}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
              Pagar {items.length > 0 ? currency.format(totals.total) : ""}
            </button>
          </form>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
