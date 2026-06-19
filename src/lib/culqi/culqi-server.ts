// src/lib/culqi/culqi-server.ts
// Simulador del backend de Culqi — sin llamadas HTTP externas a Culqi
// En producción, este módulo haría llamadas a https://api.culqi.com/v2/charges

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ResultadoCargo {
  id: string;
  object: "charge";
  amount: number;           // en céntimos (ej: S/ 59.90 → 5990)
  currency_code: string;    // "PEN"
  email: string;
  outcome: {
    type: "venta_exitosa" | "tarjeta_rechazada" | "fondos_insuficientes";
    code: string;
    merchant_message: string;
    user_message: string;
  };
  source: {
    id: string;             // token recibido
    last_four: string;
  };
  creation_date: number;    // timestamp Unix
}

export type ResultadoCargoExito = ResultadoCargo & {
  outcome: { type: "venta_exitosa" };
};

export type ResultadoCargoError = ResultadoCargo & {
  outcome: { type: "tarjeta_rechazada" | "fondos_insuficientes" };
};

// ── Simulador de cargo ────────────────────────────────────────────────────────

/**
 * Simula la creación de un cargo en Culqi.
 * En producción, esto haría un POST a https://api.culqi.com/v2/charges
 * usando la CULQI_PRIVATE_KEY del servidor.
 *
 * @param tokenId  - Token generado por culqi-client (simulado localmente)
 * @param monto    - Monto en soles (ej: 59.90) — se convierte a céntimos
 * @param email    - Email del comprador
 */
export function crearCargo(
  tokenId: string,
  monto: number,
  email: string = "cliente@simulacion.com"
): ResultadoCargo {
  // Convertir soles a céntimos (Culqi usa enteros)
  const montoCentimos = Math.round(monto * 100);

  // Determinar si el token es de tarjeta rechazada
  const esRechazado = tokenId.startsWith("tkn_rechazado_");

  // Extraer últimos 4 dígitos del token (si aplica)
  const ultimos4 = tokenId.slice(-4);

  if (esRechazado) {
    // Simular cargo rechazado
    return {
      id: `chr_rechazado_${Date.now()}`,
      object: "charge",
      amount: montoCentimos,
      currency_code: "PEN",
      email,
      outcome: {
        type: "fondos_insuficientes",
        code: "card_declined",
        merchant_message: "La tarjeta fue rechazada por el banco emisor.",
        user_message: "Tu tarjeta fue rechazada. Por favor, intenta con otra tarjeta.",
      },
      source: {
        id: tokenId,
        last_four: ultimos4,
      },
      creation_date: Math.floor(Date.now() / 1000),
    };
  }

  // Simular cargo exitoso
  return {
    id: `chr_aprobado_${Date.now()}`,
    object: "charge",
    amount: montoCentimos,
    currency_code: "PEN",
    email,
    outcome: {
      type: "venta_exitosa",
      code: "AUT000",
      merchant_message: "La operación de venta ha sido autorizada exitosamente.",
      user_message: "Su pago fue procesado exitosamente.",
    },
    source: {
      id: tokenId,
      last_four: ultimos4,
    },
    creation_date: Math.floor(Date.now() / 1000),
  };
}

/**
 * Verifica si un cargo fue exitoso.
 */
export function esCargExitoso(cargo: ResultadoCargo): cargo is ResultadoCargoExito {
  return cargo.outcome.type === "venta_exitosa";
}
