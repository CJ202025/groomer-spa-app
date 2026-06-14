// src/components/booking/AppointmentCalendar.tsx
// Selector de fecha + lista de barberos disponibles (RF-05, RF-06)
// Consulta GET /api/reservas?fecha=... al cambiar la fecha

"use client";

import { useState, useEffect, useCallback } from "react";

interface Barbero {
  id: string;
  nombre_completo: string;
  email: string;
  disponible: boolean;
}

interface AppointmentCalendarProps {
  onSeleccion: (barberoId: string, fechaHoraInicio: string) => void;
}

// Horas disponibles en el día (09:00 - 19:00, cada 30 min)
const HORAS_DISPONIBLES = Array.from({ length: 21 }, (_, i) => {
  const totalMinutos = 9 * 60 + i * 30;
  const h = String(Math.floor(totalMinutos / 60)).padStart(2, "0");
  const m = String(totalMinutos % 60).padStart(2, "0");
  return `${h}:${m}`;
});

// Fecha mínima: hoy
function hoyISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AppointmentCalendar({
  onSeleccion,
}: AppointmentCalendarProps) {
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<string>("");

  const cargarDisponibilidad = useCallback(
    async (fechaSeleccionada: string) => {
      setCargando(true);
      setError(null);
      setBarberoSeleccionado("");

      try {
        const res = await fetch(`/api/reservas?fecha=${fechaSeleccionada}`);
        const data = await res.json();

        if (!res.ok)
          throw new Error(data.error ?? "Error al consultar disponibilidad");

        setBarberos(data.barberos ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        setBarberos([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (fecha) cargarDisponibilidad(fecha);
  }, [fecha, cargarDisponibilidad]);

  // Notificar al padre cuando hay barbero + hora seleccionados
  useEffect(() => {
    if (barberoSeleccionado && fecha && hora) {
      const fechaHoraInicio = `${fecha}T${hora}:00`;
      onSeleccion(barberoSeleccionado, fechaHoraInicio);
    }
  }, [barberoSeleccionado, fecha, hora, onSeleccion]);

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de fecha */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fecha-cita"
          className="text-sm font-semibold text-stone-700"
        >
          Fecha de la cita
        </label>
        <input
          id="fecha-cita"
          type="date"
          min={hoyISO()}
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value);
            setHora("");
          }}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Selector de hora */}
      {fecha && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="hora-cita"
            className="text-sm font-semibold text-stone-700"
          >
            Hora de inicio
          </label>
          <select
            id="hora-cita"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          >
            <option value="">Selecciona una hora</option>
            {HORAS_DISPONIBLES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lista de barberos */}
      {fecha && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-stone-700">
            Especialista disponible
          </p>

          {cargando && (
            <p className="text-sm text-stone-400 animate-pulse">
              Consultando disponibilidad...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!cargando && !error && barberos.length === 0 && (
            <p className="text-sm text-stone-400">
              No hay especialistas registrados.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {barberos.map((b) => {
              const seleccionado = barberoSeleccionado === b.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    disabled={!b.disponible}
                    onClick={() => setBarberoSeleccionado(b.id)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400
                      ${
                        !b.disponible
                          ? "border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed opacity-60"
                          : seleccionado
                            ? "border-amber-400 bg-amber-50 text-stone-900 font-semibold shadow-sm"
                            : "border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    aria-pressed={seleccionado}
                  >
                    <span>{b.nombre_completo || b.email}</span>
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        b.disponible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {b.disponible ? "Disponible" : "Ocupado"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
