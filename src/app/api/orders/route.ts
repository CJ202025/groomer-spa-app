// src/app/api/orders/route.ts
// Route Handler POST — Creación de orden con pago simulado Culqi — RF-13, RF-14, RF-15
// MODIFICACIÓN FASE 6 — acumulación de Groomer Credits (RF-16) y canje de créditos (RF-18)

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
      // MODIFICACIÓN FASE 6 — inicio
      creditos_usados = 0, // RF-18: créditos canjeados por el usuario (bloques de 100)
      // MODIFICACIÓN FASE 6 — fin
    } = body;

    // Validaciones básicas
    if (!token_pago || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos para crear la orden" },
        { status: 400 }
      );
    }

    // MODIFICACIÓN FASE 6 — inicio
    // ── Validar saldo de Groomer Credits si se están canjeando ────────────────
    if (creditos_usados > 0) {
      const { data: perfil, error: errorPerfil } = await (supabase as any)
        .from("users")
        .select("groomer_credits")
        .eq("id", user.id)
        .single();

      if (errorPerfil || !perfil) {
        return NextResponse.json(
          { error: "No se pudo verificar el saldo de créditos" },
          { status: 500 }
        );
      }

      const saldoActual: number = perfil.groomer_credits ?? 0;
      if (saldoActual < creditos_usados) {
        return NextResponse.json(
          { error: `Saldo insuficiente de Groomer Credits. Tienes ${saldoActual} pts.` },
          { status: 400 }
        );
      }
    }
    // MODIFICACIÓN FASE 6 — fin

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

    // MODIFICACIÓN FASE 6 — inicio
    // ── 3b. Gestionar Groomer Credits del usuario ─────────────────────────────

    // Obtener créditos actuales
    const { data: perfilCreditos } = await (supabase as any)
      .from("users")
      .select("groomer_credits")
      .eq("id", user.id)
      .single();

    const creditosActuales: number = perfilCreditos?.groomer_credits ?? 0;

    // RF-18: Descontar créditos canjeados
    const creditosDescontados = creditos_usados > 0 ? creditos_usados : 0;

    // RF-16: Acumular 1 crédito por cada S/1 gastado en el total final
    const creditosGanados = Math.floor(total);

    const creditosFinales = creditosActuales - creditosDescontados + creditosGanados;

    await (supabase as any)
      .from("users")
      .update({ groomer_credits: Math.max(0, creditosFinales) })
      .eq("id", user.id);

    console.log(
      `[orders] Créditos usuario ${user.id}: actuales=${creditosActuales}, canjeados=${creditosDescontados}, ganados=${creditosGanados}, finales=${Math.max(0, creditosFinales)}`
    );
    // MODIFICACIÓN FASE 6 — fin

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
        // MODIFICACIÓN FASE 6 — inicio
        creditosGanados: Math.floor(total), // RF-16: info de créditos acumulados
        // MODIFICACIÓN FASE 6 — fin
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
