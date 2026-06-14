// src/lib/utils.ts

// ── Penalidad por cancelación (RF-08) ─────────────────────────────────────────
// Si la cita se cancela con menos de 24h de anticipación → 50% del precio base

export function calcularPenalidad(
  fechaHoraInicio: Date,
  precioBase: number,
): { aplicaPenalidad: boolean; monto: number } {
  const ahora = new Date();
  const diffMs = fechaHoraInicio.getTime() - ahora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);

  if (diffHoras < 24) {
    return { aplicaPenalidad: true, monto: precioBase * 0.5 };
  }
  return { aplicaPenalidad: false, monto: 0 };
}

// ── Formateadores de moneda y fecha ───────────────────────────────────────────

export function formatearSoles(monto: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(monto);
}

export function formatearFecha(isoString: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(isoString));
}

// ── calcularTotal se implementará en Fase 4 ───────────────────────────────────
// export function calcularTotal(subtotal: number, costoEnvio: number, descuentos: number): number
