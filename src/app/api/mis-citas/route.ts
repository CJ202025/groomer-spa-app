// src/app/api/mis-citas/route.ts
// GET → citas del usuario autenticado con detalle de servicio y barbero (RF-02)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: citas, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      fecha_hora_inicio,
      estado,
      services:servicio_id ( nombre, precio_base, variante_nivel ),
      barbero:barbero_id ( nombre_completo, email )
    `,
    )
    .eq("usuario_id", user.id)
    .order("fecha_hora_inicio", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalizar nombres de relaciones
  const citasNormalizadas = (citas ?? []).map((c: any) => ({
    id: c.id,
    fecha_hora_inicio: c.fecha_hora_inicio,
    estado: c.estado,
    servicio: c.services ?? null,
    barbero: c.barbero ?? null,
  }));

  return NextResponse.json({ citas: citasNormalizadas });
}
