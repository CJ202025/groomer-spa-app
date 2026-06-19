// src/app/api/webhooks/route.ts
// Route Handler POST — Recepción de webhooks de Culqi (simulados) — RF-15
// En producción, Culqi envía estos eventos desde sus servidores tras confirmar el pago

import { NextRequest, NextResponse } from "next/server";
import { generarBoleta } from "@/lib/facturacion";

// ── Tipos de eventos Culqi ────────────────────────────────────────────────────

interface WebhookPayload {
  type: "charge.succeeded" | "charge.failed" | "charge.disputed";
  data: {
    object: {
      id: string;
      amount: number;
      currency_code: string;
      metadata?: {
        order_id?: string;
      };
    };
  };
}

// ── Validador de firma (simulado) ─────────────────────────────────────────────

/**
 * En producción, Culqi envía una firma HMAC-SHA256 en el header "x-culqi-signature"
 * que se valida con CULQI_WEBHOOK_SECRET.
 * En esta simulación, aceptamos llamadas internas con la firma "simulacion_interna".
 */
function validarFirmaWebhook(req: NextRequest): boolean {
  const firma = req.headers.get("x-culqi-signature");

  // Permitir llamadas internas del Route Handler /api/orders
  if (firma === "simulacion_interna") return true;

  // En producción: validar HMAC aquí
  // const secreto = process.env.CULQI_WEBHOOK_SECRET;
  // return validarHMAC(body, firma, secreto);

  return false;
}

// ── POST /api/webhooks ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Validar firma
    if (!validarFirmaWebhook(req)) {
      console.warn("[webhook] Firma inválida rechazada");
      return NextResponse.json(
        { error: "Firma de webhook inválida" },
        { status: 401 }
      );
    }

    // 2. Parsear el payload
    const payload: WebhookPayload = await req.json();

    console.log(`[webhook] Evento recibido: ${payload.type}`);

    // 3. Manejar según tipo de evento
    switch (payload.type) {
      case "charge.succeeded": {
        const orderId = payload.data.object.metadata?.order_id;

        if (!orderId) {
          console.warn("[webhook] charge.succeeded sin order_id en metadata");
          return NextResponse.json({ received: true });
        }

        // Generar boleta electrónica simulada en PDF
        console.log(`[webhook] Generando boleta para orden: ${orderId}`);
        const boletaUrl = await generarBoleta(orderId);

        if (boletaUrl) {
          console.log(`[webhook] Boleta generada: ${boletaUrl}`);
        } else {
          console.warn(`[webhook] No se pudo generar la boleta para orden: ${orderId}`);
        }

        break;
      }

      case "charge.failed": {
        // En producción: marcar orden como fallida, notificar usuario
        console.log(`[webhook] Pago fallido para cargo: ${payload.data.object.id}`);
        break;
      }

      case "charge.disputed": {
        // En producción: escalar al equipo de soporte
        console.log(`[webhook] Disputa para cargo: ${payload.data.object.id}`);
        break;
      }

      default:
        console.log(`[webhook] Evento no manejado: ${(payload as any).type}`);
    }

    // 4. Siempre responder 200 a Culqi para confirmar recepción
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[webhook] Error procesando webhook:", error);
    // Responder 200 de todas formas para evitar reintentos de Culqi
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
