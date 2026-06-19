// src/lib/culqi/culqi-client.ts
// Simulador 100% LOCAL del SDK de Culqi — sin llamadas a servidores externos
// En producción, este archivo se reemplaza por el script oficial: https://checkout.culqi.com/js/v4

"use client";

// ── Tarjetas de prueba ────────────────────────────────────────────────────────

/**
 * Tarjetas de prueba para la simulación.
 * En producción, Culqi.js valida estas tarjetas contra sus servidores.
 */
export const TARJETAS_PRUEBA = [
  { numero: "4111 1111 1111 1111", resultado: "aprobado", descripcion: "Visa — Pago aprobado" },
  { numero: "4000 0000 0000 0002", resultado: "rechazado", descripcion: "Visa — Fondos insuficientes" },
  { numero: "4000 0000 0000 0069", resultado: "rechazado", descripcion: "Visa — Tarjeta vencida" },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DatosTarjeta {
  numero: string;
  cvv: string;
  mes: string;
  anio: string;
  nombre: string;
  email: string;
}

export interface TokenCulqi {
  id: string;            // token simulado (UUID local)
  tipo: "aprobado" | "rechazado";
  ultimos4: string;
  email: string;
}

// ── Generador de token simulado ───────────────────────────────────────────────

/**
 * Simula la tokenización de Culqi.js.
 * En producción, este proceso ocurre en los servidores de Culqi (PCI-DSS).
 * Aquí generamos un UUID local y determinamos el resultado según la tarjeta.
 */
export function simularTokenizacion(datos: DatosTarjeta): TokenCulqi {
  // Normalizar número de tarjeta (quitar espacios)
  const numeroLimpio = datos.numero.replace(/\s/g, "");

  // Determinar si la tarjeta es de prueba "rechazada"
  const esRechazada =
    numeroLimpio === "4000000000000002" ||
    numeroLimpio === "4000000000000069";

  // Generar un token UUID local (simulado)
  const prefijo = esRechazada ? "tkn_rechazado_" : "tkn_aprobado_";
  const uuid = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return {
    id: `${prefijo}${uuid}`,
    tipo: esRechazada ? "rechazado" : "aprobado",
    ultimos4: numeroLimpio.slice(-4),
    email: datos.email,
  };
}

/**
 * Formatea el número de tarjeta mientras el usuario escribe.
 * Agrega espacios cada 4 dígitos: "4111 1111 1111 1111"
 */
export function formatearNumeroTarjeta(valor: string): string {
  const soloDigitos = valor.replace(/\D/g, "").substring(0, 16);
  return soloDigitos.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Valida que los datos básicos de la tarjeta estén completos.
 */
export function validarDatosTarjeta(datos: DatosTarjeta): string | null {
  const numeroLimpio = datos.numero.replace(/\s/g, "");
  if (numeroLimpio.length < 16) return "Número de tarjeta inválido";
  if (datos.cvv.length < 3) return "CVV inválido";
  if (!datos.mes || !datos.anio) return "Fecha de vencimiento inválida";
  if (!datos.nombre.trim()) return "Ingresa el nombre del titular";
  if (!datos.email.includes("@")) return "Email inválido";
  return null;
}
