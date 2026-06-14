// src/app/dashboard/gestion-citas/page.tsx
// Vista de gestión de citas para rol 'barbero' y 'admin' (RF-07, RF-03)
// Barbero: ve sus citas asignadas. Admin: ve todas con filtros.

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatearFecha, formatearSoles } from "@/lib/utils";
import type { EstadoCita, Rol } from "@/types/database";

interface CitaGestion {
  id: string;
  fecha_hora_inicio: string;
  estado: EstadoCita;
  servicio: {
    nombre: string;
    precio_base: number;
    variante_nivel: string;
  } | null;
  cliente: { nombre_completo: string; email: string } | null;
  barbero: { id: string; nombre_completo: string; email: string } | null;
}

const BADGE_ESTADO: Record<EstadoCita, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmada: "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-stone-100 text-stone-500",
};

// Transiciones permitidas por la UI (alineadas con el backend)
const SIGUIENTE_ESTADO: Partial<Record<EstadoCita, EstadoCita[]>> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["completada", "cancelada"],
};

const LABEL_ESTADO: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmar",
  completada: "Completar",
  cancelada: "Cancelar",
};

export default function GestionCitasPage() {
  const [citas, setCitas] = useState<CitaGestion[]>([]);
  const [rol, setRol] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros (solo para admin)
  const [filtroEstado, setFiltroEstado] = useState<EstadoCita | "">("");
  const [filtroBarbero, setFiltroBarbero] = useState<string>("");

  // Estado de cambio de estado
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [errorActualizacion, setErrorActualizacion] = useState<string | null>(
    null,
  );

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/gestion-citas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar");
      setCitas(data.citas ?? []);
      setRol(data.rol ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  async function handleCambiarEstado(citaId: string, nuevoEstado: EstadoCita) {
    setActualizando(citaId);
    setErrorActualizacion(null);

    try {
      const res = await fetch(`/api/reservas/${citaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar");
      await cargarCitas();
    } catch (err) {
      setErrorActualizacion(
        err instanceof Error ? err.message : "Error desconocido",
      );
    } finally {
      setActualizando(null);
    }
  }

  // Aplicar filtros en cliente (para admin)
  const citasFiltradas = citas.filter((c) => {
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroBarbero && c.barbero?.id !== filtroBarbero) return false;
    return true;
  });

  // Obtener lista única de barberos para el filtro (admin)
  const barberosFiltro = Array.from(
    new Map(
      citas.filter((c) => c.barbero).map((c) => [c.barbero!.id, c.barbero!]),
    ).values(),
  );

  return (
    <div className="px-4 py-8 md:px-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        {rol === "admin" ? "Gestión de citas" : "Mis citas asignadas"}
      </h1>

      {/* Filtros solo para admin */}
      {rol === "admin" && (
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoCita | "")}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {barberosFiltro.length > 0 && (
            <select
              value={filtroBarbero}
              onChange={(e) => setFiltroBarbero(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Todos los especialistas</option>
              {barberosFiltro.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre_completo || b.email}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {errorActualizacion && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {errorActualizacion}
        </p>
      )}

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

      {!cargando && citasFiltradas.length === 0 && (
        <p className="text-stone-400 text-sm py-10 text-center">
          No hay citas para mostrar.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {citasFiltradas.map((cita) => {
          const siguientes = SIGUIENTE_ESTADO[cita.estado] ?? [];
          const estaActualizando = actualizando === cita.id;

          return (
            <li
              key={cita.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-3 shadow-sm"
            >
              {/* Encabezado */}
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
                  {/* Admin ve cliente; barbero también */}
                  <p className="text-xs text-stone-400 mt-0.5">
                    Cliente:{" "}
                    {cita.cliente?.nombre_completo ||
                      cita.cliente?.email ||
                      "—"}
                  </p>
                  {rol === "admin" && cita.barbero && (
                    <p className="text-xs text-stone-400">
                      Especialista:{" "}
                      {cita.barbero.nombre_completo || cita.barbero.email}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    BADGE_ESTADO[cita.estado]
                  }`}
                >
                  {cita.estado}
                </span>
              </div>

              {/* Fecha y precio */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">
                  {formatearFecha(cita.fecha_hora_inicio)}
                </span>
                {cita.servicio && (
                  <span className="font-semibold text-stone-900">
                    {formatearSoles(cita.servicio.precio_base)}
                  </span>
                )}
              </div>

              {/* Botones de cambio de estado */}
              {siguientes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {siguientes.map((sig) => (
                    <button
                      key={sig}
                      onClick={() => handleCambiarEstado(cita.id, sig)}
                      disabled={estaActualizando}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40
                        ${
                          sig === "cancelada"
                            ? "border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-400"
                            : sig === "completada"
                              ? "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400"
                              : "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400"
                        }`}
                    >
                      {estaActualizando ? "Actualizando..." : LABEL_ESTADO[sig]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
