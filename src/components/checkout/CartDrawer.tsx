// src/components/checkout/CartDrawer.tsx
// Panel lateral del carrito — RF-10

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeCart();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeCart]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-800">
              Mi carrito
            </h2>
            {items.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Tu carrito está vacío
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Agrega productos desde el catálogo
                </p>
              </div>
              <button
                onClick={closeCart}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Ver catálogo →
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, cantidad }) => (
                <li
                  key={product.id}
                  className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0"
                >
                  {/* Imagen placeholder */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-slate-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {product.nombre}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {product.categoria}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Selector de cantidad */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(product.id, cantidad - 1)
                          }
                          aria-label="Reducir cantidad"
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          {cantidad === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-800">
                          {cantidad}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(product.id, cantidad + 1)
                          }
                          aria-label="Aumentar cantidad"
                          disabled={cantidad >= product.stock_actual}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>

                      {/* Subtotal ítem */}
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(product.precio * cantidad)}
                      </span>
                    </div>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label={`Eliminar ${product.nombre}`}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer con total y CTA */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(
                  items.reduce((sum, i) => sum + i.product.precio * i.cantidad, 0)
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Envío calculado en el checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Ir al checkout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}