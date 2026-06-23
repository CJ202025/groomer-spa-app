// src/app/dashboard/creditos/page.tsx
// Vista de Groomer Credits del usuario — RF-02, RF-16, RF-18, RF-19

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

// ── Componente ────────────────────────────────────────────────────────────────

export default async function CreditosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await (supabase as any)
    .from("users")
    .select("nombre_completo, groomer_credits, es_miembro_elite")
    .eq("id", user.id)
    .single();

  const groomerCredits: number = perfil?.groomer_credits ?? 0;
  const esMiembroElite: boolean = perfil?.es_miembro_elite ?? false;

  // Bloques canjeables y equivalencia en soles
  const bloquesDisponibles = Math.floor(groomerCredits / 100);
  const descuentoEquivalente = bloquesDisponibles * 5;

  // Porcentaje hacia el siguiente umbral de 100 pts
  const ptsDentroDelBloque = groomerCredits % 100;
  const ptsParaSiguienteBloque = ptsDentroDelBloque > 0 ? 100 - ptsDentroDelBloque : 0;

  return (
    <div className="px-4 py-8 md:px-8 max-w-xl mx-auto">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Groomer Credits</h1>
        <p className="text-sm text-stone-500 mt-1">
          Tu saldo de puntos y beneficios de fidelización
        </p>
      </div>

      {/* Tarjeta de saldo principal */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white shadow-lg mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-6" />
        <p className="text-sm font-medium text-amber-100 relative z-10">
          Saldo disponible
        </p>
        <p className="text-5xl font-black mt-1 relative z-10 tracking-tight">
          {groomerCredits.toLocaleString("es-PE")}
        </p>
        <p className="text-sm text-amber-100 mt-1 relative z-10">pts</p>
        <div className="mt-4 pt-4 border-t border-amber-400/40 relative z-10">
          <p className="text-sm text-amber-100">
            Equivalen a{" "}
            <span className="font-bold text-white">
              {formatCurrency(descuentoEquivalente)}
            </span>{" "}
            de descuento
          </p>
        </div>
      </div>

      {/* Barra de progreso al siguiente bloque */}
      {ptsDentroDelBloque > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-4">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-semibold text-stone-700">
              Próximo bloque canjeable
            </p>
            <p className="text-xs text-stone-400">
              {ptsParaSiguienteBloque} pts restantes
            </p>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${ptsDentroDelBloque}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {ptsDentroDelBloque}/100 pts · cada 100 pts = {formatCurrency(5)} de descuento
          </p>
        </div>
      )}

      {/* Reglas de acumulación */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-stone-800 mb-3">
          Cómo ganar puntos
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🛍️</span>
            <div>
              <p className="text-sm font-medium text-stone-700">
                Compras en el catálogo
              </p>
              <p className="text-xs text-stone-500">
                1 crédito por cada S/1 gastado en pedidos
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg mt-0.5">✂️</span>
            <div>
              <p className="text-sm font-medium text-stone-700">
                Citas completadas
              </p>
              <p className="text-xs text-stone-500">
                1 crédito por cada S/1 del precio base del servicio
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🎂</span>
            <div>
              <p className="text-sm font-medium text-stone-700">
                Bono de cumpleaños
              </p>
              <p className="text-xs text-stone-500">
                +100 créditos automáticos en tu fecha de cumpleaños
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg mt-0.5">⭐</span>
            <div>
              <p className="text-sm font-medium text-stone-700">
                Bono por reseña
              </p>
              <p className="text-xs text-stone-500">
                +30 créditos al dejar una reseña verificada
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Estado de membresía Elite */}
      <div
        className={`rounded-2xl border p-5 shadow-sm mb-6 ${
          esMiembroElite
            ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
            : "bg-white border-stone-200"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-800">
            Membresía Groomer Elite
          </h2>
          <span
            className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
              esMiembroElite
                ? "bg-amber-200 text-amber-800"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {esMiembroElite ? "✦ ACTIVA" : "INACTIVA"}
          </span>
        </div>

        {esMiembroElite ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <span>✓</span>
              <span>15% de descuento automático en todas tus compras</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <span>✓</span>
              <span>Prioridad de atención en citas (badge visible)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <span>✓</span>
              <span>Acumulación de Groomer Credits en cada compra</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-500 mb-3">
            Activa la membresía Elite por solo{" "}
            <span className="font-semibold text-stone-700">S/39/mes</span> y
            disfruta de descuentos exclusivos y prioridad en el calendario.
          </p>
        )}

        <Link
          href="/dashboard/membresia"
          className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
            esMiembroElite
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-stone-900 hover:bg-stone-800 text-white"
          }`}
        >
          {esMiembroElite ? "✦ Renovar membresía" : "Activar membresía Elite →"}
        </Link>
      </div>

      {/* CTA — ir al checkout */}
      {bloquesDisponibles > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              ¡Tienes créditos para canjear!
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Puedes usar {bloquesDisponibles} bloque{bloquesDisponibles > 1 ? "s" : ""} ={" "}
              {formatCurrency(descuentoEquivalente)} de descuento en tu próxima compra
            </p>
          </div>
          <Link
            href="/catalogo"
            className="shrink-0 ml-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            Ir a comprar
          </Link>
        </div>
      )}
    </div>
  );
}
