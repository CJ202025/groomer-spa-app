// src/app/checkout/confirmacion/page.tsx
// Página de confirmación de pedido post-pago — RF-13, RF-15

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Download,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency, formatDate } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface DatosOrden {
  id: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  metodo_envio: string;
  estado_pedido: string;
  token_pago: string;
  boleta_url: string | null;
  created_at?: string; // opcional: presente si Supabase añadió la columna automáticamente
}

// ── Contenido principal ───────────────────────────────────────────────────────

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCartStore();

  const [orden, setOrden] = useState<DatosOrden | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Limpiar carrito al llegar a esta página
    clearCart();

    if (!orderId) {
      setError("No se encontró el ID de la orden.");
      setCargando(false);
      return;
    }

    // Polling para obtener los datos de la orden (espera a que la boleta esté lista)
    let intentos = 0;
    const maxIntentos = 10;

    const obtenerOrden = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Error obteniendo la orden");
        const data = await res.json();
        setOrden(data.orden);

        // Si no tiene boleta aún y quedan intentos, volver a intentar
        if (!data.orden?.boleta_url && intentos < maxIntentos) {
          intentos++;
          setTimeout(obtenerOrden, 1500);
        } else {
          setCargando(false);
        }
      } catch (err) {
        console.error(err);
        setError("Error cargando los datos de la orden.");
        setCargando(false);
      }
    };

    obtenerOrden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Estado de carga
  if (cargando && !orden) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-600 text-sm">Procesando tu orden...</p>
      </main>
    );
  }

  // Error
  if (error || !orderId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <Package className="w-12 h-12 text-slate-300" />
        <p className="text-slate-600 font-medium text-center">
          {error ?? "Orden no encontrada"}
        </p>
        <Link href="/catalogo" className="text-sm text-indigo-600 hover:underline">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const numeroCorto = orderId.substring(0, 8).toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      <div className="max-w-lg mx-auto px-4 py-12">

        {/* Ícono de éxito */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-100">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            ¡Pedido confirmado!
          </h1>
          <p className="text-slate-500 text-sm">
            Tu pago fue procesado exitosamente en el entorno Sandbox.
          </p>
        </div>

        {/* Tarjeta de resumen */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">

          {/* Encabezado de la tarjeta */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium">Número de orden</p>
                <p className="text-white font-bold font-mono text-lg">#{numeroCorto}</p>
              </div>
              <span className="px-2.5 py-1 bg-green-400/20 text-green-300 text-xs font-semibold rounded-full border border-green-400/30">
                Confirmado
              </span>
            </div>
          </div>

          {/* Datos de la orden */}
          <div className="px-5 py-4 space-y-3">
            {orden && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(orden.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Envío ({orden.metodo_envio.replace("_", " ")})
                  </span>
                  <span className="font-medium text-slate-800">
                    {orden.costo_envio === 0 ? "Gratis" : formatCurrency(orden.costo_envio)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                  <span className="text-slate-900">Total pagado</span>
                  <span className="text-indigo-600">{formatCurrency(orden.total)}</span>
                </div>
              </>
            )}

            {/* Fecha */}
            {orden?.created_at && (
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(orden.created_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boleta PDF */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Comprobante electrónico
          </h2>

          {cargando && !orden?.boleta_url ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Generando boleta PDF...</span>
            </div>
          ) : orden?.boleta_url ? (
            <a
              href={orden.boleta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Boleta PDF
            </a>
          ) : (
            <p className="text-xs text-slate-400">
              La boleta estará disponible en breve en tu historial de pedidos.
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/pedidos"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm text-center transition-colors flex items-center justify-center gap-2"
          >
            Ver mis pedidos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/catalogo"
            className="w-full py-3 text-slate-600 hover:text-indigo-600 font-medium text-sm text-center transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── Export con Suspense (requerido por useSearchParams) ───────────────────────

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </main>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
