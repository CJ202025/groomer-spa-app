// src/lib/utils.ts
// Utilidades de negocio — Groomer SPA

// ── Formato de moneda ─────────────────────────────────────────────────────────

/**
 * Formatea un número como moneda peruana (S/).
 * Ejemplo: 39 → "S/ 39.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Formato de fechas ─────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO 8601 a texto legible en español.
 * Ejemplo: "2025-06-15T14:00:00" → "domingo, 15 de junio de 2025, 14:00"
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea solo la fecha (sin hora).
 */
export function formatDateOnly(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Lógica de penalidad por cancelación (Fase 3) ────────────────────────────

/**
 * Calcula la penalidad por cancelación de una cita.
 * Regla: si la cancelación ocurre con menos de 24h de anticipación,
 * se retiene el 50% del precio base.
 */
export function calcularPenalidad(
  fechaHoraInicio: Date,
  precioBase: number
): { aplicaPenalidad: boolean; monto: number } {
  const ahora = new Date();
  const horasRestantes =
    (fechaHoraInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  if (horasRestantes < 24) {
    return { aplicaPenalidad: true, monto: precioBase * 0.5 };
  }
  return { aplicaPenalidad: false, monto: 0 };
}

// ── Lógica de totales del carrito (Fase 4) ───────────────────────────────────

/**
 * Costos de envío según modalidad de entrega.
 * Valores de referencia (ajustar según política comercial del negocio).
 */
export const COSTOS_ENVIO: Record<string, number> = {
  Recojo: 0,
  Delivery_Local: 8,
  Nacional: 20,
};

/**
 * Calcula el total exacto de una orden.
 * RF-14: subtotal + costoEnvio - descuentos = total
 *
 * @param subtotal    - Suma de precios de los ítems × cantidad
 * @param costoEnvio  - Costo según modalidad de entrega
 * @param descuentos  - Descuentos aplicados (Groomer Credits, Elite, cupones)
 * @returns           - Total a pagar (nunca negativo)
 */
export function calcularTotal(
  subtotal: number,
  costoEnvio: number,
  descuentos: number = 0
): number {
  return Math.max(0, subtotal + costoEnvio - descuentos);
}

/**
 * Calcula el descuento en soles dado un bloque de Groomer Credits.
 * Regla: 100 créditos = S/ 5 de descuento.
 */
export function calcularDescuentoCreditos(creditos: number): number {
  const bloques = Math.floor(creditos / 100);
  return bloques * 5;
}

/**
 * Calcula el descuento Elite (15%) sobre el subtotal.
 */
export function calcularDescuentoElite(subtotal: number): number {
  return subtotal * 0.15;
}

// ── SKU helpers ───────────────────────────────────────────────────────────────

/**
 * Genera un SKU legible desde un nombre.
 * Ejemplo: "Champú de Barba Premium" → "CHAMP-BARB-PREM"
 */
export function generarSKU(nombre: string, prefijo: string = ""): string {
  const slug = nombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.substring(0, 4))
    .join("-");
  return prefijo ? `${prefijo}-${slug}` : slug;
}
