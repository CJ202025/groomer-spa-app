// src/app/dashboard/membresia/page.tsx
// Vista de gestión de membresía Groomer Elite — RF-19, RF-20

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModalPago } from "@/components/checkout/ModalPago";
import type { TokenCulqi } from "@/lib/culqi/culqi-client";
import { formatCurrency } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface PerfilUsuario {
  nombre_completo: string;
  groomer_credits: number;
  es_miembro_elite: boolean;
}

// ── Beneficios Elite ──────────────────────────────────────────────────────────

const BENEFICIOS = [
  {
    icono: "💸",
    titulo: "15% de descuento en compras",
    descripcion: "Aplicado automáticamente en el carrito en cada pedido.",
  },
  {
    icono: "⭐",
    titulo: "Prioridad en citas",
    descripcion:
      "Tu cita aparece con badge de Prioridad Elite para que el especialista te atienda primero.",
  },
  {
    icono: "🏆",
    titulo: "Acumulación de Groomer Credits",
    descripcion: "Sigue acumulando 1 punto por cada S/1 gastado, ahora con descuentos.",
  },
  {
    icono: "🎂",
    titulo: "Bono de cumpleaños mejorado",
    descripcion: "+100 créditos automáticos el día de tu cumpleaños.",
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

export default function MembresiasPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Cargar perfil del usuario
  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/perfil");
        if (!res.ok) return;
        const data = await res.json();
        setPerfil(data.perfil ?? null);
      } catch {
        // ignorar
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // Manejar token del modal de pago
  const handleToken = async (token: TokenCulqi) => {
    setModalAbierto(false);
    setProcesando(true);
    setError(null);

    try {
      const res = await fetch("/api/membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_pago: token.id,
          email: token.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al activar la membresía. Intenta nuevamente.");
        return;
      }

      setExito(true);
      // Actualizar el perfil local
      setPerfil((prev) => (prev ? { ...prev, es_miembro_elite: true } : prev));

      // Redirigir al dashboard tras 2 segundos
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Error de conexión. Por favor intenta nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 animate-pulse text-sm">Cargando membresía...</p>
      </div>
    );
  }

  const esMiembroElite = perfil?.es_miembro_elite ?? false;

  return (
    <div className="px-4 py-8 md:px-8 max-w-xl mx-auto">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          Groomer Elite
          {esMiembroElite && (
            <span className="text-base bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 font-bold">
              ✦ ACTIVA
            </span>
          )}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Suscripción mensual con beneficios exclusivos
        </p>
      </div>

      {/* Banner de éxito */}
      {exito && (
        <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 p-5 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">
              ¡Membresía Elite activada exitosamente!
            </p>
            <p className="text-sm text-green-600 mt-0.5">
              Redirigiendo al dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta de membresía */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 mb-6 shadow-md ${
          esMiembroElite
            ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white"
            : "bg-gradient-to-br from-stone-800 to-stone-900 text-white"
        }`}
      >
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-10 -translate-x-8" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
                {esMiembroElite ? "Membresía activa" : "Membresía disponible"}
              </p>
              <p className="text-3xl font-black">Groomer Elite</p>
            </div>
            <span className="text-4xl opacity-80">✦</span>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">
                {formatCurrency(39)}
              </span>
              <span className="text-sm opacity-70">/mes</span>
            </div>
            <p className="text-xs opacity-60 mt-1">
              Simulado — sin cobros reales
            </p>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">
          Beneficios incluidos
        </h2>
        <ul className="space-y-4">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{b.icono}</span>
              <div>
                <p className="text-sm font-semibold text-stone-700">
                  {b.titulo}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{b.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Botón de acción */}
      {!exito && (
        <button
          onClick={() => setModalAbierto(true)}
          disabled={procesando}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            esMiembroElite
              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
              : "bg-gradient-to-r from-stone-900 to-stone-700 hover:from-stone-800 hover:to-stone-600 text-white shadow-stone-300"
          }`}
        >
          {procesando ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Procesando...
            </>
          ) : (
            <>
              {esMiembroElite ? "✦ Renovar Groomer Elite" : "✦ Activar Groomer Elite"} —{" "}
              {formatCurrency(39)}/mes
            </>
          )}
        </button>
      )}

      {/* Badge sandbox */}
      <p className="text-center text-xs text-stone-400 mt-4">
        🔒 Entorno Sandbox · Sin cobros reales · Usa tarjetas de prueba
      </p>

      {/* Modal de pago simulado */}
      {modalAbierto && (
        <ModalPago
          monto={39}
          emailCliente=""
          onToken={handleToken}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
