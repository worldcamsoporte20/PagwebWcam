"use client";

import { ArrowRight, Heart, PackageSearch, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { addCartItem } from "../../lib/cart";
import {
  FAVORITES_UPDATED_EVENT,
  FavoriteProduct,
  favoriteProductKey,
  readFavoriteProducts,
  removeFavoriteProduct,
} from "../../lib/favorites";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setFavorites(readFavoriteProducts());
    refresh();
    window.addEventListener(FAVORITES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function removeFavorite(product: FavoriteProduct) {
    removeFavoriteProduct(favoriteProductKey(product));
    setFavorites(readFavoriteProducts());
  }

  function addFavoriteToCart(product: FavoriteProduct) {
    const id = favoriteProductKey(product);
    addCartItem({
      id,
      productId: product.id,
      variantId: product.variantId,
      sku: product.sku,
      clave: product.clave || product.sku,
      brand: product.brand || "Worldcam",
      category: product.category || "Sin categoría",
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setLastAddedId(id);
    window.setTimeout(() => setLastAddedId((current) => (current === id ? null : current)), 1300);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#080d19] dark:text-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
            <Heart className="h-7 w-7 fill-current" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Tu selección</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">Productos favoritos</h1>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-white/15 dark:bg-white/[0.04]">
            <Heart className="mx-auto h-14 w-14 text-slate-300 dark:text-white/25" aria-hidden />
            <h2 className="mt-5 text-2xl font-black">Aún no tienes favoritos</h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-blue-100/60">
              Pulsa el corazón de cualquier producto para guardarlo aquí.
            </p>
            <a
              href="/catalogo"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-black text-white transition hover:bg-blue-600"
            >
              Explorar productos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((product) => {
              const id = favoriteProductKey(product);
              return (
                <article
                  key={id}
                  className="group flex min-h-[450px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-white/10 dark:bg-[#121827]"
                >
                  <div className="relative flex h-56 items-center justify-center bg-gradient-to-b from-white to-slate-50 p-6 dark:from-white/[0.04] dark:to-transparent">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-contain transition group-hover:scale-105" />
                    ) : (
                      <PackageSearch className="h-20 w-20 text-slate-300" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFavorite(product)}
                      className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-white/95 text-red-500 shadow-md transition hover:scale-105 hover:bg-red-50"
                      aria-label={`Quitar de favoritos: ${product.name}`}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col border-t border-slate-100 p-5 dark:border-white/10">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">{product.brand || "Worldcam"}</p>
                    <h2 className="mt-3 line-clamp-2 min-h-12 text-base font-black leading-6">{product.name}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-400">Clave: {product.clave || product.sku}</p>
                    <p className="mt-4 text-2xl font-black">{product.price > 0 ? currency.format(product.price) : "Cotizar"}</p>

                    <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5">
                      <button
                        type="button"
                        onClick={() => addFavoriteToCart(product)}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition ${lastAddedId === id ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"}`}
                      >
                        <ShoppingCart className="h-5 w-5" aria-hidden />
                        {lastAddedId === id ? "Agregado" : "Agregar al carrito"}
                      </button>
                      <a
                        href={`/catalogo/${encodeURIComponent(id)}`}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white"
                        aria-label={`Ver detalle de ${product.name}`}
                      >
                        <ArrowRight className="h-5 w-5" aria-hidden />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
