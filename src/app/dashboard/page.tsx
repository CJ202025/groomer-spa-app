// src/app/dashboard/page.tsx
// Página de inicio del dashboard — secciones placeholder para Fases 3 y 5

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await (supabase as any)
        .from("users")
        .select("nombre_completo, rol, groomer_credits, es_miembro_elite")
        .eq("id", user.id)
        .single();

    const primerNombre = profile?.nombre_completo?.split(" ")[0] ?? "allí";
    const rol = profile?.rol ?? "cliente";

    return (
        <div className="px-4 py-8 md:px-8">
            {/* Saludo */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">
                    Hola, {primerNombre} 👋
                </h1>
                <p className="mt-1 text-sm text-stone-500 capitalize">
                    Cuenta {rol}
                    {profile?.es_miembro_elite && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            ✦ Elite
                        </span>
                    )}
                </p>
            </div>

            {/* Grid de tarjetas */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Groomer Credits — placeholder Fase 6 */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        Groomer Credits
                    </p>
                    <p className="mt-1 text-3xl font-bold text-stone-900">
                        {profile?.groomer_credits ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                        Equivalen a{" "}
                        <span className="font-semibold text-amber-600">
                            S/ {(Math.floor((profile?.groomer_credits ?? 0) / 100) * 5).toFixed(2)}
                        </span>{" "}
                        de descuento
                    </p>
                </div>

                {/* Mis citas — placeholder Fase 3 */}
                {(rol === "cliente" || rol === "barbero") && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                            Mis citas
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                            Aquí verás tu historial de citas próximamente.
                        </p>
                        {rol === "cliente" && (
                            <Link
                                href="/reservar"
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                + Reservar cita
                            </Link>
                        )}
                    </div>
                )}

                {/* Mis pedidos — placeholder Fase 5 */}
                {rol === "cliente" && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                            Mis pedidos
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                            Tu historial de compras aparecerá aquí próximamente.
                        </p>
                        <Link
                            href="/catalogo"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2"
                        >
                            Ver catálogo →
                        </Link>
                    </div>
                )}

                {/* Panel admin — acceso rápido */}
                {rol === "admin" && (
                    <div className="rounded-2xl bg-stone-900 p-5 shadow-sm text-white">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                            Panel Admin
                        </p>
                        <p className="mt-1 text-sm text-stone-300">
                            Gestiona pedidos, inventario y citas del negocio.
                        </p>
                        <Link
                            href="/admin"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            Ir al admin →
                        </Link>
                    </div>
                )}
            </div>

            {/* Acceso rápido para barbero */}
            {rol === "barbero" && (
                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <h2 className="text-base font-semibold text-stone-800">
                        Gestión de citas
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                        Revisa y actualiza el estado de tus citas asignadas.
                    </p>
                    <Link
                        href="/dashboard/gestion-citas"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                        Ver mis citas →
                    </Link>
                </div>
            )}
        </div>
    );
}