// src/app/checkout/page.tsx
// Checkout con selección de envío, total dinámico e integración de pago simulado — RF-11, RF-13, RF-14

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Truck,
  Package,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import {
  calcularTotal,
  COSTOS_ENVIO,
  formatCurrency,
} from "@/lib/utils";
import type { MetodoEnvio } from "@/types/database";

// MODIFICACIÓN FASE 5 — inicio
import { ModalPago } from "@/components/checkout/ModalPago";
import type { TokenCulqi } from "@/lib/culqi/culqi-client";
// MODIFICACIÓN FASE 5 — fin

// ── Opciones de envío ─────────────────────────────────────────────────────────

const OPCIONES_ENVIO: {
  value: MetodoEnvio;
  label: string;
  descripcion: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "Recojo",
    label: "Recojo en tienda",
    descripcion: "Retira tu pedido en nuestro local. Sin costo.",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    value: "Delivery_Local",
    label: "Delivery local",
    descripcion: "Entrega en Trujillo. 2-4 horas.",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    value: "Nacional",
    label: "Envío nacional",
    descripcion: "Todo el Perú. 3-5 días hábiles.",
    icon: <Package className="w-4 h-4" />,
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const [metodoEnvio, setMetodoEnvio] = useState<MetodoEnvio>("Recojo");

  // MODIFICACIÓN FASE 5 — inicio
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  // MODIFICACIÓN FASE 5 — fin

  const costoEnvio = COSTOS_ENVIO[metodoEnvio];
  const sub = subtotal();
  const total = calcularTotal(sub, costoEnvio);

  // Si el carrito está vacío, redirigir al catálogo
  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="w-12 h-12 text-slate-300" />
        <p className="text-slate-600 font-medium">Tu carrito está vacío</p>
        <Link
          href="/catalogo"
          className="text-sm text-indigo-600 hover:underline"
        >
          Ver catálogo
        </Link>
      </main>
    );
  }

  // MODIFICACIÓN FASE 5 — inicio
  // Manejar el token recibido del modal de pago
  const handleToken = async (token: TokenCulqi) => {
    setModalAbierto(false);
    setProcesandoPago(true);
    setErrorPago(null);

    try {
      const payload = {
        token_pago: token.id,
        email: token.email,
        items: items.map((item) => ({
          productId: item.product.id,
          cantidad: item.cantidad,
          precio: item.product.precio,
        })),
        metodo_envio: metodoEnvio,
        subtotal: sub,
        costo_envio: costoEnvio,
        total: total,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorPago(data.error ?? "Error al procesar el pago. Intenta nuevamente.");
        return;
      }

      // Limpiar carrito y redirigir a la confirmación
      clearCart();
      router.push(`/checkout/confirmacion?orderId=${data.orderId}`);
    } catch {
      setErrorPago("Error de conexión. Por favor intenta nuevamente.");
    } finally {
      setProcesandoPago(false);
    }
  };
  // MODIFICACIÓN FASE 5 — fin

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Seguir comprando
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Resumen de compra
        </h1>

        <div className="space-y-4">
          {/* Ítems del carrito */}
          <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Productos ({items.reduce((s, i) => s + i.cantidad, 0)})
            </h2>
            <ul className="divide-y divide-slate-50">
              {items.map(({ product, cantidad }) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {product.nombre}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrency(product.precio)} × {cantidad}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 ml-4">
                    {formatCurrency(product.precio * cantidad)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Modalidad de entrega — RF-11 */}
          <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Modalidad de entrega
            </h2>
            <div className="space-y-2">
              {OPCIONES_ENVIO.map((opcion) => (
                <label
                  key={opcion.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    metodoEnvio === opcion.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo_envio"
                    value={opcion.value}
                    checked={metodoEnvio === opcion.value}
                    onChange={() => setMetodoEnvio(opcion.value)}
                    className="sr-only"
                  />
                  <span
                    className={`${
                      metodoEnvio === opcion.value
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    {opcion.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {opcion.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {opcion.descripcion}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {COSTOS_ENVIO[opcion.value] === 0
                      ? "Gratis"
                      : formatCurrency(COSTOS_ENVIO[opcion.value])}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Resumen de totales — RF-14 */}
          <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Total
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío ({metodoEnvio.replace("_", " ")})</span>
                <span>
                  {costoEnvio === 0 ? "Gratis" : formatCurrency(costoEnvio)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100 mt-2">
                <span>Total a pagar</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {/* MODIFICACIÓN FASE 5 — inicio */}

          {/* Error de pago */}
          {errorPago && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorPago}</p>
            </div>
          )}

          {/* Badge de sandbox */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2 text-xs text-indigo-700">
            <span className="text-base">🔒</span>
            <span>
              <strong>Entorno Sandbox:</strong> Usa las tarjetas de prueba del modal. Sin cobros reales.
            </span>
          </div>

          {/* Botón de pago activo */}
          <button
            onClick={() => setModalAbierto(true)}
            disabled={procesandoPago}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {procesandoPago ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Procesando pago...
              </>
            ) : (
              <>🔒 Pagar {formatCurrency(total)}</>
            )}
          </button>

          {/* Modal de pago simulado */}
          {modalAbierto && (
            <ModalPago
              monto={total}
              emailCliente=""
              onToken={handleToken}
              onCerrar={() => setModalAbierto(false)}
            />
          )}

          {/* MODIFICACIÓN FASE 5 — fin */}
        </div>
      </div>
    </main>
  );
}