// src/app/api/orders/[id]/route.ts
// Route Handler GET — Obtener datos de una orden por ID — usado en confirmación y dashboard

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
