// src/app/dashboard/citas/page.tsx
// Historial de citas del cliente con lógica de penalidad por cancelación (RF-02, RF-07, RF-08)

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatCurrency, calcularPenalidad } from "@/lib/utils";
import type { EstadoCita } from "@/types/database";

interface CitaConDetalle {
  id: string;
  fecha_hora_inicio: string;
  estado: EstadoCita;
  servicio: {
    nombre: string;
    precio_base: number;
    variante_nivel: string;
  } | null;
  barbero: { nombre_completo: string; email: string } | null;
}

const BADGE_ESTADO: Record<EstadoCita, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmada: "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-stone-100 text-stone-500",
};

export default function MisCitasPage() {
  const [citas, setCitas] = useState<CitaConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [citaACancelar, setCitaACancelar] = useState<CitaConDetalle | null>(
    null,
  );
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/mis-citas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar citas");
      setCitas(data.citas ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  async function handleCancelar() {
    if (!citaACancelar) return;
    setCancelando(true);
    setErrorCancelacion(null);
    try {
      const res = await fetch(`/api/reservas/${citaACancelar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelada" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo cancelar");
      setCitaACancelar(null);
      await cargarCitas();
    } catch (err) {
      setErrorCancelacion(
        err instanceof Error ? err.message : "Error desconocido",
      );
    } finally {
      setCancelando(false);
    }
  }

  const penalidad =
    citaACancelar && citaACancelar.servicio
      ? calcularPenalidad(
          new Date(citaACancelar.fecha_hora_inicio),
          citaACancelar.servicio.precio_base,
        )
      : { aplicaPenalidad: false, monto: 0 };

  function esCancelable(c: CitaConDetalle) {
    return c.estado === "pendiente" || c.estado === "confirmada";
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mis citas</h1>

      {cargando && (
        <p className="text-sm text-stone-400 animate-pulse">
          Cargando citas...
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!cargando && citas.length === 0 && (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm mb-4">
            Aún no tienes citas reservadas.
          </p>

          <a
            href="/reservar"
            className="inline-block rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Reservar ahora
          </a>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {citas.map((cita) => (
          <li
            key={cita.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-stone-900 text-sm">
                  {cita.servicio?.nombre ?? "Servicio"}
                  {cita.servicio?.variante_nivel && (
                    <span className="ml-1.5 text-xs text-amber-600">
                      ({cita.servicio.variante_nivel})
                    </span>
                  )}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {cita.barbero?.nombre_completo || cita.barbero?.email || "—"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  BADGE_ESTADO[cita.estado]
                }`}
              >
                {cita.estado}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">
                {formatDate(cita.fecha_hora_inicio)}
              </span>
              {cita.servicio && (
                <span className="font-semibold text-stone-900">
                  {formatCurrency(cita.servicio.precio_base)}
                </span>
              )}
            </div>

            {esCancelable(cita) && (
              <button
                onClick={() => {
                  setCitaACancelar(cita);
                  setErrorCancelacion(null);
                }}
                className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Cancelar cita
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Modal de confirmación de cancelación */}
      {citaACancelar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <h2
              id="modal-titulo"
              className="text-base font-bold text-stone-900"
            >
              ¿Cancelar esta cita?
            </h2>

            <div className="text-sm text-stone-600 flex flex-col gap-1">
              <p>
                <span className="font-medium">Servicio:</span>{" "}
                {citaACancelar.servicio?.nombre}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{" "}
                {formatDate(citaACancelar.fecha_hora_inicio)}
              </p>
            </div>

            {/* Advertencia de penalidad (RF-08) */}
            {penalidad.aplicaPenalidad ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex flex-col gap-1">
                <p className="text-sm font-semibold text-red-700">
                  ⚠️ Penalidad por cancelación tardía
                </p>
                <p className="text-xs text-red-600">
                  La cita es en menos de 24 horas. Se retendrá el 50% del valor:
                </p>
                <p className="text-base font-bold text-red-700">
                  {formatCurrency(penalidad.monto)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                Cancelación gratuita (más de 24h de anticipación).
              </p>
            )}

            {errorCancelacion && (
              <p className="text-xs text-red-600">{errorCancelacion}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setCitaACancelar(null)}
                disabled={cancelando}
                className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {cancelando ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
