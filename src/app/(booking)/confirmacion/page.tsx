// src/app/(booking)/confirmacion/page.tsx
// Página de confirmación post-reserva (RF-05, RF-07)

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatearFecha, formatearSoles } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmacionPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) redirect("/reservar");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: cita, error } = await (supabase as any)
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single();

  if (error || !cita) redirect("/dashboard/citas");

  const [{ data: servicio }, { data: barbero }] = await Promise.all([
    (supabase as any)
      .from("services")
      .select("nombre, precio_base, variante_nivel")
      .eq("id", cita.servicio_id)
      .single(),
    (supabase as any)
      .from("users")
      .select("nombre_completo, email")
      .eq("id", cita.barbero_id)
      .single(),
  ]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Ícono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="w-8 h-8 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-stone-900 mb-1">
          ¡Cita reservada!
        </h1>
        <p className="text-center text-sm text-stone-500 mb-8">
          Tu cita está pendiente de confirmación por el equipo.
        </p>

        {/* Tarjeta de resumen */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-4 mb-6">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Estado</dt>
              <dd>
                <span className="rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 capitalize">
                  {cita.estado}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Servicio</dt>
              <dd className="font-medium text-stone-900 text-right">
                {servicio?.nombre ?? "—"}{" "}
                {servicio?.variante_nivel && (
                  <span className="text-xs text-amber-600">
                    ({servicio.variante_nivel})
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Especialista</dt>
              <dd className="font-medium text-stone-900">
                {barbero?.nombre_completo || barbero?.email || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Fecha y hora</dt>
              <dd className="font-medium text-stone-900 text-right">
                {formatearFecha(cita.fecha_hora_inicio)}
              </dd>
            </div>
            {servicio && (
              <div className="flex justify-between border-t border-stone-100 pt-3">
                <dt className="font-semibold text-stone-700">Valor</dt>
                <dd className="font-bold text-stone-900">
                  {formatearSoles(servicio.precio_base)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/citas"
            className="block text-center rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Ver mis citas
          </Link>
          <Link
            href="/reservar"
            className="block text-center rounded-xl border border-stone-300 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Reservar otra cita
          </Link>
        </div>
      </div>
    </div>
  );
}
