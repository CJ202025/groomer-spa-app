// src/app/api/membresia/route.ts
// Route Handler POST — Activar/renovar membresía Groomer Elite por S/39 simulado — RF-19

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crearCargo, esCargExitoso } from "@/lib/culqi/culqi-server";

// ── Costo de la membresía Elite ───────────────────────────────────────────────

const PRECIO_ELITE_SOLES = 39;

// ── POST /api/membresia ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { token_pago, email } = body;

    if (!token_pago) {
      return NextResponse.json(
        { error: "Token de pago requerido" },
        { status: 400 }
      );
    }

    // ── 1. Simular cargo Culqi por S/39 ──────────────────────────────────────

    const cargo = crearCargo(
      token_pago,
      PRECIO_ELITE_SOLES,
      email ?? user.email ?? ""
    );

    if (!esCargExitoso(cargo)) {
      return NextResponse.json(
        {
          error: cargo.outcome.user_message,
          code: cargo.outcome.code,
        },
        { status: 402 }
      );
    }

    // ── 2. Activar membresía Elite del usuario ────────────────────────────────

    const { error: errorUpdate } = await (supabase as any)
      .from("users")
      .update({ es_miembro_elite: true })
      .eq("id", user.id);

    if (errorUpdate) {
      console.error("[membresia] Error activando membresía:", errorUpdate);
      return NextResponse.json(
        { error: "Error al activar la membresía Elite" },
        { status: 500 }
      );
    }

    console.log(
      `[membresia] Membresía Elite activada para usuario ${user.id}. Cargo simulado: ${cargo.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "¡Membresía Groomer Elite activada exitosamente!",
        tokenPago: cargo.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[membresia] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
