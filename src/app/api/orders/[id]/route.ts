// src/app/api/orders/[id]/route.ts
// GET  — Obtener datos de una orden por ID (confirmación y dashboard)
// PATCH — Actualizar estado logístico del pedido (RF-22, solo admin)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EstadoPedido } from "@/types/database";

// ── GET /api/orders/[id] ──────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener la orden (solo la propia del usuario, o admin puede ver cualquiera)
    const { data: orden, error } = await (supabase as any)
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar que la orden pertenece al usuario (o es admin)
    const { data: perfil } = await (supabase as any)
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (orden.usuario_id !== user.id && perfil?.rol !== "admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    return NextResponse.json({ orden }, { status: 200 });
  } catch (error) {
    console.error("[orders/id] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── PATCH /api/orders/[id] ────────────────────────────────────────────────────

const VALID_ESTADOS: EstadoPedido[] = ["confirmado", "en_preparacion", "completado"];

const ORDER_INDEX: Record<EstadoPedido, number> = {
  confirmado: 0,
  en_preparacion: 1,
  completado: 2,
};

/**
 * Actualiza el estado logístico de un pedido.
 *
 * Regla de negocio (RF-22):
 * Al transicionar a 'en_preparacion', se descuenta automáticamente el stock_actual
 * de cada producto FÍSICO (es_dropshipping = false) involucrado en el pedido.
 * Los pedidos ya llegan con estado 'confirmado' desde el checkout, por lo que
 * la deducción ocurre cuando el admin comienza la preparación del envío.
 * Los productos de dropshipping NO modifican stock.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Verificar autenticación y rol admin
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: profile } = (await (supabase as any)
    .from("users")
    .select("rol")
    .eq("id", authUser.id)
    .single()) as any;

  if (!profile || profile.rol !== "admin") {
    return NextResponse.json(
      { error: "Acceso denegado. Se requiere rol admin." },
      { status: 403 }
    );
  }

  // Parsear body
  let body: { estado_pedido?: EstadoPedido };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { estado_pedido } = body;

  if (!estado_pedido || !VALID_ESTADOS.includes(estado_pedido)) {
    return NextResponse.json(
      {
        error: `Estado inválido. Valores permitidos: ${VALID_ESTADOS.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const { id: orderId } = await params;

  // Obtener pedido actual
  const { data: order, error: orderError } = (await (supabase as any)
    .from("orders")
    .select("id, estado_pedido")
    .eq("id", orderId)
    .single()) as any;

  if (orderError || !order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  // Prevenir retroceso de estado (confirmado → en_preparacion → completado)
  if (ORDER_INDEX[estado_pedido] <= ORDER_INDEX[order.estado_pedido as EstadoPedido]) {
    return NextResponse.json(
      { error: "No se puede retroceder el estado de un pedido." },
      { status: 422 }
    );
  }

  // ── RF-22: Deducción de stock al pasar a 'en_preparacion' ──────────────────
  // Los pedidos nacen como 'confirmado' al pagar; el stock se deduce cuando
  // el admin inicia la preparación física del envío.
  if (estado_pedido === "en_preparacion" && order.estado_pedido === "confirmado") {
    const { data: items, error: itemsError } = (await (supabase as any)
      .from("order_items")
      .select("cantidad, producto_id, products(id, stock_actual, es_dropshipping, nombre)")
      .eq("pedido_id", orderId)
      .not("producto_id", "is", null)) as any;

    if (itemsError) {
      return NextResponse.json(
        { error: "No se pudieron obtener los ítems del pedido." },
        { status: 500 }
      );
    }

    // Solo productos físicos (no dropshipping)
    const itemsFisicos = ((items ?? []) as any[]).filter(
      (item: any) => item.products && !item.products.es_dropshipping
    );

    for (const item of itemsFisicos) {
      const product = item.products as {
        id: string;
        stock_actual: number;
        nombre: string;
      } | null;

      if (!product) continue;

      const nuevoStock = product.stock_actual - item.cantidad;

      if (nuevoStock < 0) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock_actual}, solicitado: ${item.cantidad}.`,
          },
          { status: 422 }
        );
      }

      const { error: stockError } = await (supabase as any)
        .from("products")
        .update({ stock_actual: nuevoStock })
        .eq("id", product.id);

      if (stockError) {
        return NextResponse.json(
          { error: `Error al actualizar stock de "${product.nombre}".` },
          { status: 500 }
        );
      }
    }
  }

  // Actualizar estado del pedido
  const { data: updated, error: updateError } = (await (supabase as any)
    .from("orders")
    .update({ estado_pedido })
    .eq("id", orderId)
    .select()
    .single()) as any;

  if (updateError) {
    return NextResponse.json(
      { error: "No se pudo actualizar el estado del pedido." },
      { status: 500 }
    );
  }

  return NextResponse.json({ order: updated }, { status: 200 });
}
