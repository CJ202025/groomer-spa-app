// src/components/checkout/ModalPago.tsx
// Modal de pago simulado Culqi — formulario de tarjeta 100% local — RF-13

"use client";

import { useState } from "react";
import {
  CreditCard,
  X,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  simularTokenizacion,
  formatearNumeroTarjeta,
  validarDatosTarjeta,
  TARJETAS_PRUEBA,
  type DatosTarjeta,
  type TokenCulqi,
} from "@/lib/culqi/culqi-client";
import { formatCurrency } from "@/lib/utils";

// ── Props ──────────────────────────────────────────────────────────────────────

interface ModalPagoProps {
  monto: number;                          // total en soles
  emailCliente: string;
  onToken: (token: TokenCulqi) => void;   // callback al obtener el token
  onCerrar: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ModalPago({ monto, emailCliente, onToken, onCerrar }: ModalPagoProps) {
  const [datos, setDatos] = useState<DatosTarjeta>({
    numero: "",
    cvv: "",
    mes: "",
    anio: "",
    nombre: "",
    email: emailCliente,
  });
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarTarjetas, setMostrarTarjetas] = useState(false);

  // Actualizar campo
  const handleChange = (campo: keyof DatosTarjeta, valor: string) => {
    setErrorForm(null);
    if (campo === "numero") {
      setDatos((prev) => ({ ...prev, numero: formatearNumeroTarjeta(valor) }));
    } else if (campo === "cvv") {
      setDatos((prev) => ({ ...prev, cvv: valor.replace(/\D/g, "").substring(0, 4) }));
    } else if (campo === "mes") {
      setDatos((prev) => ({ ...prev, mes: valor.replace(/\D/g, "").substring(0, 2) }));
    } else if (campo === "anio") {
      setDatos((prev) => ({ ...prev, anio: valor.replace(/\D/g, "").substring(0, 2) }));
    } else {
      setDatos((prev) => ({ ...prev, [campo]: valor }));
    }
  };

  // Usar tarjeta de prueba rápida
  const usarTarjetaPrueba = (numero: string) => {
    setDatos((prev) => ({
      ...prev,
      numero: formatearNumeroTarjeta(numero.replace(/\s/g, "")),
      cvv: "123",
      mes: "12",
      anio: "26",
      nombre: "CLIENTE PRUEBA",
    }));
    setMostrarTarjetas(false);
  };

  // Procesar pago
  const handlePagar = async () => {
    const errorValidacion = validarDatosTarjeta(datos);
    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    setProcesando(true);

    // Simular latencia de red (600ms)
    await new Promise((r) => setTimeout(r, 600));

    const token = simularTokenizacion(datos);
    setProcesando(false);
    onToken(token);
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400/20 rounded-full p-2">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Pago seguro simulado</p>
              <p className="text-slate-400 text-xs">Culqi Sandbox — Sin cobros reales</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monto */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800 font-medium">Total a pagar</span>
          <span className="text-xl font-bold text-amber-700">{formatCurrency(monto)}</span>
        </div>

        {/* Formulario */}
        <div className="px-6 py-5 space-y-4">

          {/* Acceso rápido a tarjetas de prueba */}
          <div>
            <button
              type="button"
              onClick={() => setMostrarTarjetas(!mostrarTarjetas)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              🧪 Usar tarjeta de prueba (Sandbox)
            </button>
            {mostrarTarjetas && (
              <div className="mt-2 space-y-1.5">
                {TARJETAS_PRUEBA.map((t) => (
                  <button
                    key={t.numero}
                    type="button"
                    onClick={() => usarTarjetaPrueba(t.numero)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                      t.resultado === "aprobado"
                        ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-800"
                        : "border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                    }`}
                  >
                    <span className="mr-2">{t.resultado === "aprobado" ? "✅" : "❌"}</span>
                    {t.numero} — {t.descripcion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Número de tarjeta */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Número de tarjeta
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={datos.numero}
              onChange={(e) => handleChange("numero", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-300"
            />
          </div>

          {/* CVV + Vencimiento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mes</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM"
                value={datos.mes}
                onChange={(e) => handleChange("mes", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Año</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="AA"
                value={datos.anio}
                onChange={(e) => handleChange("anio", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="***"
                value={datos.cvv}
                onChange={(e) => handleChange("cvv", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Nombre del titular */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nombre del titular
            </label>
            <input
              type="text"
              placeholder="Como aparece en la tarjeta"
              value={datos.nombre}
              onChange={(e) => handleChange("nombre", e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email de confirmación
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={datos.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
            />
          </div>

          {/* Error de validación */}
          {errorForm && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{errorForm}</p>
            </div>
          )}

          {/* Botón pagar */}
          <button
            type="button"
            onClick={handlePagar}
            disabled={procesando}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {procesando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pagar {formatCurrency(monto)}
              </>
            )}
          </button>

          {/* Pie de seguridad */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] text-slate-400 text-center">
              Simulación segura · Sin cobros reales · Entorno Sandbox Culqi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
