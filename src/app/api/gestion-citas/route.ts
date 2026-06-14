// src/app/api/gestion-citas/route.ts
// GET → citas para gestión según rol: barbero (las suyas) o admin (todas) (RF-07, RF-03)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener rol del usuario
  const { data: perfil } = await (supabase as any)
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  const rol: Rol = perfil?.rol ?? "cliente";

  if (rol !== "barbero" && rol !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // Query base con relaciones
  let query = (supabase as any)
    .from("appointments")
    .select(
      `
      id,
      fecha_hora_inicio,
      estado,
      services:servicio_id ( nombre, precio_base, variante_nivel ),
      cliente:usuario_id ( nombre_completo, email ),
      barbero:barbero_id ( id, nombre_completo, email )
    `,
    )
    .order("fecha_hora_inicio", { ascending: false });

  // Barbero solo ve sus citas asignadas
  if (rol === "barbero") {
    query = query.eq("barbero_id", user.id);
  }

  const { data: citas, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const citasNormalizadas = (citas ?? []).map((c: any) => ({
    id: c.id,
    fecha_hora_inicio: c.fecha_hora_inicio,
    estado: c.estado,
    servicio: c.services ?? null,
    cliente: c.cliente ?? null,
    barbero: c.barbero ?? null,
  }));

  return NextResponse.json({ citas: citasNormalizadas, rol });
}
