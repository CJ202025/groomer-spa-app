// src/app/api/perfil/route.ts
// Route Handler GET — Retorna el perfil del usuario autenticado (groomer_credits, es_miembro_elite, etc.)
// Usado por el checkout y otras vistas de cliente para leer datos del perfil sin SSR

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET /api/perfil ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: perfil, error } = await (supabase as any)
      .from("users")
      .select(
        "id, nombre_completo, email, telefono, rol, groomer_credits, es_miembro_elite"
      )
      .eq("id", user.id)
      .single();

    if (error || !perfil) {
      console.error("[perfil] Error obteniendo perfil:", error);
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ perfil }, { status: 200 });
  } catch (error) {
    console.error("[perfil] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
