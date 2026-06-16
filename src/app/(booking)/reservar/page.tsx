// src/app/(booking)/reservar/page.tsx
// Flujo de reserva en 3 pasos: Servicio → Barbero/Fecha → Confirmación (RF-05)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/catalog/ServiceCard";
import AppointmentCalendar from "@/components/booking/AppointmentCalendar";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Service } from "@/types/database";

type Paso = 1 | 2 | 3;

interface ResumenCita {
  servicio: Service;
  barberoId: string;
  barberoNombre: string;
  fechaHoraInicio: string;
}

export default function ReservarPage() {
  const router = useRouter();

  const [paso, setPaso] = useState<Paso>(1);
  const [servicios, setServicios] = useState<Service[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState<string | null>(null);

  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<Service | null>(null);
  const [barberoId, setBarberoId] = useState<string>("");
  const [barberoNombre, setBarberoNombre] = useState<string>("");
  const [fechaHoraInicio, setFechaHoraInicio] = useState<string>("");

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Cargar catálogo de servicios al montar
  useEffect(() => {
    async function cargarServicios() {
      try {
        const res = await fetch("/api/servicios");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al cargar servicios");
        setServicios(data.servicios ?? []);
      } catch (err) {
        setErrorServicios(
          err instanceof Error ? err.message : "Error desconocido",
        );
      } finally {
        setCargandoServicios(false);
      }
    }
    cargarServicios();
  }, []);

  // Callback del calendario: recibe barberoId y fechaHoraInicio
  function handleSeleccionCalendario(
    selBarberoId: string,
    selFechaHora: string,
  ) {
    setBarberoId(selBarberoId);
    setFechaHoraInicio(selFechaHora);
  }

  // Resolver nombre del barbero para el resumen
  useEffect(() => {
    if (!barberoId) return;
    async function resolverNombre() {
      try {
        const res = await fetch(
          `/api/reservas?fecha=${fechaHoraInicio.split("T")[0]}`,
        );
        const data = await res.json();
        const barbero = (data.barberos ?? []).find(
          (b: { id: string; nombre_completo: string; email: string }) =>
            b.id === barberoId,
        );
        if (barbero) setBarberoNombre(barbero.nombre_completo || barbero.email);
      } catch {
        // No crítico para el flujo
      }
    }
    resolverNombre();
  }, [barberoId, fechaHoraInicio]);

  async function handleConfirmar() {
    if (!servicioSeleccionado || !barberoId || !fechaHoraInicio) return;

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicio_id: servicioSeleccionado.id,
          barbero_id: barberoId,
          fecha_hora_inicio: fechaHoraInicio,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error al crear la cita");

      // Navegar a la página de confirmación con el id de la cita
      router.push(`/confirmacion?id=${data.cita.id}`);
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  }

  const puedePasar2 = !!servicioSeleccionado;
  const puedePasar3 = !!barberoId && !!fechaHoraInicio;

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-lg">
        {/* Título */}
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Reservar cita
        </h1>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Paso[]).map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  paso === n
                    ? "bg-amber-500 text-white"
                    : paso > n
                      ? "bg-green-500 text-white"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {paso > n ? "✓" : n}
              </div>
              {n < 3 && (
                <div
                  className={`h-0.5 w-8 rounded ${
                    paso > n ? "bg-green-400" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm text-stone-500">
            {paso === 1 && "Elige un servicio"}
            {paso === 2 && "Elige especialista y fecha"}
            {paso === 3 && "Confirma tu cita"}
          </span>
        </div>

        {/* ── PASO 1: Catálogo de servicios ── */}
        {paso === 1 && (
          <div className="flex flex-col gap-4">
            {cargandoServicios && (
              <p className="text-sm text-stone-400 animate-pulse">
                Cargando servicios...
              </p>
            )}
            {errorServicios && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {errorServicios}
              </p>
            )}
            {!cargandoServicios &&
              servicios.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  modoSeleccion
                  onSeleccionar={(srv) => {
                    setServicioSeleccionado(srv);
                    setPaso(2);
                  }}
                />
              ))}
          </div>
        )}

        {/* ── PASO 2: Barbero + Fecha/Hora ── */}
        {paso === 2 && (
          <div className="flex flex-col gap-6">
            {/* Servicio seleccionado (resumen) */}
            {servicioSeleccionado && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 font-medium">
                    Servicio seleccionado
                  </p>
                  <p className="text-sm font-semibold text-stone-900">
                    {servicioSeleccionado.nombre}
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-700">
                  {formatCurrency(servicioSeleccionado.precio_base)}
                </span>
              </div>
            )}

            <AppointmentCalendar onSeleccion={handleSeleccionCalendario} />

            <div className="flex gap-3">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={() => setPaso(3)}
                disabled={!puedePasar3}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Resumen y confirmación ── */}
        {paso === 3 && servicioSeleccionado && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-stone-900">
                Resumen de tu cita
              </h2>

              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Servicio</dt>
                  <dd className="font-medium text-stone-900 text-right">
                    {servicioSeleccionado.nombre}{" "}
                    <span className="text-xs text-amber-600">
                      ({servicioSeleccionado.variante_nivel})
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Especialista</dt>
                  <dd className="font-medium text-stone-900">
                    {barberoNombre || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Fecha y hora</dt>
                  <dd className="font-medium text-stone-900">
                    {fechaHoraInicio ? formatDate(fechaHoraInicio) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-3">
                  <dt className="font-semibold text-stone-700">Total</dt>
                  <dd className="font-bold text-stone-900 text-base">
                    {formatCurrency(servicioSeleccionado.precio_base)}
                  </dd>
                </div>
              </dl>
            </div>

            {errorEnvio && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {errorEnvio}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPaso(2)}
                disabled={enviando}
                className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40"
              >
                ← Volver
              </button>
              <button
                onClick={handleConfirmar}
                disabled={enviando}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {enviando ? "Reservando..." : "Confirmar cita"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
