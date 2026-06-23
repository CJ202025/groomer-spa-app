// src/app/api/credits/bonuses/route.ts
// Route Handler POST — Otorgar bono de créditos por reseña (+30) — RF-17
// El bono de cumpleaños (+100) se gestiona mediante pg_cron en Supabase (configuración externa).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Tipos de bonos disponibles ────────────────────────────────────────────────

type TipoBono = "resena";

const MONTOS_BONO: Record<TipoBono, number> = {
  resena: 30, // RF-17: +30 créditos por dejar una reseña
};

// ── POST /api/credits/bonuses ─────────────────────────────────────────────────

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
    const tipo: TipoBono = body.tipo;

    // Validar tipo de bono
    if (!tipo || !(tipo in MONTOS_BONO)) {
      return NextResponse.json(
        { error: `Tipo de bono inválido. Tipos válidos: ${Object.keys(MONTOS_BONO).join(", ")}` },
        { status: 400 }
      );
    }

    const montoBono = MONTOS_BONO[tipo];

    // ── Sumar créditos al usuario ─────────────────────────────────────────────

    // 1. Obtener créditos actuales del usuario
    const { data: perfil, error: errorPerfil } = await (supabase as any)
      .from("users")
      .select("groomer_credits")
      .eq("id", user.id)
      .single();

    if (errorPerfil || !perfil) {
      console.error("[credits/bonuses] Error obteniendo perfil:", errorPerfil);
      return NextResponse.json(
        { error: "No se encontró el perfil del usuario" },
        { status: 404 }
      );
    }

    const creditosActuales: number = perfil.groomer_credits ?? 0;
    const nuevosCreditos = creditosActuales + montoBono;

    // 2. Actualizar créditos
    const { error: errorUpdate } = await (supabase as any)
      .from("users")
      .update({ groomer_credits: nuevosCreditos })
      .eq("id", user.id);

    if (errorUpdate) {
      console.error("[credits/bonuses] Error actualizando créditos:", errorUpdate);
      return NextResponse.json(
        { error: "Error al otorgar el bono de créditos" },
        { status: 500 }
      );
    }

    console.log(
      `[credits/bonuses] Bono "${tipo}" (+${montoBono} pts) otorgado al usuario ${user.id}. Total: ${nuevosCreditos}`
    );

    return NextResponse.json(
      {
        success: true,
        tipo,
        creditosOtorgados: montoBono,
        totalCreditos: nuevosCreditos,
        message: `¡Bono de ${montoBono} Groomer Credits acreditado exitosamente!`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[credits/bonuses] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
