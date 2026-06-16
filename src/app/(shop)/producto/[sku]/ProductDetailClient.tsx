// src/app/(shop)/producto/[sku]/ProductDetailClient.tsx
// Componente cliente para la interacción en detalle de producto

"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Package, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/database";

export function ProductDetailClient({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stockBajo = product.stock_actual <= product.stock_minimo && product.stock_actual > 0;
  const sinStock = product.stock_actual === 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Imagen */}
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center min-h-[280px]">
              <Package className="w-20 h-20 text-slate-300" />
              {/* Descomentar cuando haya imágenes reales:
              <Image
                src={product.imagen_url ?? "/placeholder-product.jpg"}
                alt={product.nombre}
                fill
                className="object-cover"
              />
              */}
            </div>

            {/* Info */}
            <div className="p-6 md:p-8 flex flex-col gap-4">
              {/* Categoría y SKU */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {product.categoria}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Nombre */}
              <h1 className="text-xl font-bold text-slate-900 leading-snug">
                {product.nombre}
              </h1>

              {/* Precio */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(product.precio)}
                </span>
              </div>

              {/* Descripción completa */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.descripcion}
              </p>

              {/* Indicador de stock */}
              <div className="flex items-center gap-2">
                {sinStock ? (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    Sin stock
                  </span>
                ) : stockBajo ? (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Últimas {product.stock_actual} unidades
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    En stock
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="mt-auto pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={sinStock || added}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    added
                      ? "bg-emerald-500 text-white"
                      : sinStock
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]"
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Agregado al carrito
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      {sinStock ? "Sin stock disponible" : "Agregar al carrito"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}