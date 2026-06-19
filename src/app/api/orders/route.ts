// src/app/api/orders/route.ts
// Route Handler POST — Creación de orden con pago simulado Culqi — RF-13, RF-14, RF-15

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crearCargo, esCargExitoso } from "@/lib/culqi/culqi-server";

// ── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Leer body
    const body = await req.json();
    const {
      token_pago,
      items,
      metodo_envio,
      subtotal,
      costo_envio,
      total,
      email,
    } = body;

    // Validaciones básicas
    if (!token_pago || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos para crear la orden" },
        { status: 400 }
      );
    }

    // ── 1. Simular cargo Culqi ──────────────────────────────────────────────────

    const cargo = crearCargo(token_pago, total, email ?? user.email ?? "");

    if (!esCargExitoso(cargo)) {
      return NextResponse.json(
        {
          error: cargo.outcome.user_message,
          code: cargo.outcome.code,
        },
        { status: 402 }
      );
    }

    // ── 2. Crear registro en tabla `orders` ────────────────────────────────────

    const { data: orden, error: errorOrden } = await (supabase as any)
      .from("orders")
      .insert({
        usuario_id: user.id,
        subtotal: subtotal,
        costo_envio: costo_envio,
        total: total,
        metodo_envio: metodo_envio,
        estado_pedido: "confirmado",
        token_pago: cargo.id, // Guardamos el ID del "cargo" simulado, nunca datos de tarjeta
      })
      .select()
      .single();

    if (errorOrden || !orden) {
      console.error("[orders] Error creando orden:", errorOrden);
      return NextResponse.json(
        { error: "Error al registrar la orden" },
        { status: 500 }
      );
    }

    // ── 3. Crear registros en tabla `order_items` ──────────────────────────────

    const orderItems = items.map((item: { productId: string; cantidad: number; precio: number }) => ({
      pedido_id: orden.id,
      producto_id: item.productId,
      servicio_id: null,
      cantidad: item.cantidad,
      subtotal: item.precio * item.cantidad,
    }));

    const { error: errorItems } = await (supabase as any)
      .from("order_items")
      .insert(orderItems);

    if (errorItems) {
      console.error("[orders] Error creando order_items:", errorItems);
      // La orden ya se creó — no revertimos, pero logueamos
    }

    // ── 4. Disparar webhook simulado (charge.succeeded) ────────────────────────

    // Llamada interna al webhook para generar la boleta PDF
    // En producción, Culqi haría esta llamada desde sus servidores
    const webhookPayload = {
      type: "charge.succeeded",
      data: {
        object: {
          id: cargo.id,
          amount: cargo.amount,
          currency_code: cargo.currency_code,
          metadata: { order_id: orden.id },
        },
      },
    };

    // Llamada asíncrona al webhook interno (fire-and-forget)
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-culqi-signature": "simulacion_interna",
      },
      body: JSON.stringify(webhookPayload),
    }).catch((err) => console.error("[orders] Error disparando webhook:", err));

    // ── 5. Responder con el ID de la orden ─────────────────────────────────────

    return NextResponse.json(
      {
        success: true,
        orderId: orden.id,
        message: "Orden creada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[orders] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
