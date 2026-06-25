"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EstadoCita } from "@/types/database";

interface AppointmentWithDetails {
  id: string;
  fecha_hora_inicio: string;
  estado: EstadoCita;
  usuario_id: string;
  servicio_id: string;
  barbero_id: string;
  users?: { nombre_completo: string; email: string; es_miembro_elite: boolean } | null;
  services?: { nombre: string; variante_nivel: string; precio_base: number } | null;
  barbers?: { nombre_completo: string } | null;
}

interface BarberOption {
  id: string;
  nombre_completo: string;
}

const ESTADO_LABELS: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ESTADO_COLORS: Record<EstadoCita, string> = {
  pendiente: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  confirmada: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  completada: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  cancelada: "bg-neutral-700/50 text-neutral-500 border border-neutral-700",
};

const ALL_ESTADOS: EstadoCita[] = ["pendiente", "confirmada", "completada", "cancelada"];

export default function AdminCitasPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<EstadoCita | "todos">("todos");
  const [filterBarbero, setFilterBarbero] = useState<string>("todos");
  // filterFecha: cadena "YYYY-MM-DD" vacía significa sin filtro
  const [filterFecha, setFilterFecha] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("users")
      .select("id, nombre_completo")
      .eq("rol", "barbero");
    setBarbers((data as BarberOption[]) ?? []);
  }, []);

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();

    let query = supabase
      .from("appointments")
      .select(`
        *,
        users:usuario_id(nombre_completo, email, es_miembro_elite),
        services:servicio_id(nombre, variante_nivel, precio_base),
        barbers:barbero_id(nombre_completo)
      `)
      .order("fecha_hora_inicio", { ascending: false });

    if (filterEstado !== "todos") {
      query = query.eq("estado", filterEstado);
    }
    if (filterBarbero !== "todos") {
      query = query.eq("barbero_id", filterBarbero);
    }
    if (filterFecha) {
      // Construimos el rango completo del día seleccionado en UTC
      // para comparar correctamente con los timestamps ISO almacenados en Supabase
      const inicio = new Date(`${filterFecha}T00:00:00`);
      const fin = new Date(`${filterFecha}T23:59:59`);
      query = query
        .gte("fecha_hora_inicio", inicio.toISOString())
        .lte("fecha_hora_inicio", fin.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      setError("No se pudieron cargar las citas.");
    } else {
      setAppointments((data as AppointmentWithDetails[]) ?? []);
    }
    setLoading(false);
  }, [filterEstado, filterBarbero, filterFecha]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const changeEstado = async (appointmentId: string, newEstado: EstadoCita) => {
    setUpdating(appointmentId);
    setError(null);

    try {
      const res = await fetch(`/api/reservas/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al actualizar la cita.");
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, estado: newEstado } : a))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setUpdating(null);
    }
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " · " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Gestión de Citas</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Todas las citas del sistema. Los clientes Elite tienen prioridad de atención.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Filtro estado */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterEstado("todos")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filterEstado === "todos"
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
              }`}
          >
            Todos
          </button>
          {ALL_ESTADOS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filterEstado === estado
                  ? "bg-amber-500 text-neutral-950"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
                }`}
            >
              {ESTADO_LABELS[estado]}
            </button>
          ))}
        </div>

        {/* Filtro barbero */}
        {barbers.length > 0 && (
          <select
            value={filterBarbero}
            onChange={(e) => setFilterBarbero(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-neutral-300
              border border-neutral-700 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los barberos</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre_completo}</option>
            ))}
          </select>
        )}

        {/* Filtro fecha */}
        <div className="flex items-center gap-1.5">
          <input
            id="admin-citas-filter-fecha"
            type="date"
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-neutral-300
              border border-neutral-700 focus:outline-none focus:border-amber-500
              [color-scheme:dark]"
          />
          {filterFecha && (
            <button
              onClick={() => setFilterFecha("")}
              title="Limpiar filtro de fecha"
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-500 hover:text-neutral-200
                hover:bg-neutral-700 border border-neutral-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          No hay citas con estos filtros.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Servicio</th>
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Barbero</th>
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Fecha / Hora</th>
                  <th className="px-4 py-3 text-center text-neutral-400 font-medium">Estado</th>
                  <th className="px-4 py-3 text-center text-neutral-400 font-medium">Cambiar estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {appointments.map((apt) => {
                  const isElite = apt.users?.es_miembro_elite ?? false;
                  return (
                    <tr
                      key={apt.id}
                      className={`transition-colors ${isElite ? "bg-amber-500/3" : "hover:bg-neutral-900/40"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isElite && (
                            <span
                              title="Cliente Groomer Elite — prioridad de atención"
                              className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold
                                bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            >
                              ELITE
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-neutral-200">
                              {apt.users?.nombre_completo ?? "—"}
                            </p>
                            <p className="text-neutral-500 text-xs">{apt.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-200">{apt.services?.nombre ?? "—"}</p>
                        <p className="text-neutral-500 text-xs">{apt.services?.variante_nivel}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {apt.barbers?.nombre_completo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                        {formatFecha(apt.fecha_hora_inicio)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${ESTADO_COLORS[apt.estado]}`}>
                          {ESTADO_LABELS[apt.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {apt.estado !== "cancelada" && apt.estado !== "completada" ? (
                          <select
                            value=""
                            disabled={updating === apt.id}
                            onChange={(e) => changeEstado(apt.id, e.target.value as EstadoCita)}
                            className="px-2 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-300
                              border border-neutral-700 focus:outline-none focus:border-amber-500
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>
                              {updating === apt.id ? "Actualizando…" : `${ESTADO_LABELS[apt.estado]} ▾`}
                            </option>
                            {ALL_ESTADOS.filter((e) => e !== apt.estado).map((e) => (
                              <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-neutral-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {appointments.map((apt) => {
              const isElite = apt.users?.es_miembro_elite ?? false;
              return (
                <div
                  key={apt.id}
                  className={`rounded-xl border p-4 ${isElite
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-neutral-800 bg-neutral-900"
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      {isElite && (
                        <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                          bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          ELITE
                        </span>
                      )}
                      <div>
                        <p className="font-semibold text-neutral-100">{apt.users?.nombre_completo ?? "—"}</p>
                        <p className="text-xs text-neutral-500">{apt.users?.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${ESTADO_COLORS[apt.estado]}`}>
                      {ESTADO_LABELS[apt.estado]}
                    </span>
                  </div>

                  <div className="text-sm text-neutral-400 space-y-0.5 mb-3">
                    <p>{apt.services?.nombre} <span className="text-neutral-600">·</span> {apt.services?.variante_nivel}</p>
                    <p>Barbero: {apt.barbers?.nombre_completo ?? "—"}</p>
                    <p className="text-xs">{formatFecha(apt.fecha_hora_inicio)}</p>
                  </div>

                  {apt.estado !== "cancelada" && apt.estado !== "completada" && (
                    <select
                      value=""
                      disabled={updating === apt.id}
                      onChange={(e) => changeEstado(apt.id, e.target.value as EstadoCita)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300
                        border border-neutral-700 focus:outline-none focus:border-amber-500
                        disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {updating === apt.id ? "Actualizando…" : `${ESTADO_LABELS[apt.estado]} ▾`}
                      </option>
                      {ALL_ESTADOS.filter((e) => e !== apt.estado).map((e) => (
                        <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}