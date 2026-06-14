// src/app/api/reservas/route.ts
// GET  → disponibilidad de barberos en una fecha dada (RF-05, RF-06)
// POST → crear nueva cita con estado 'pendiente' (RF-05, RF-07)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EstadoCita } from "@/types/database";

// ── GET /api/reservas?fecha=YYYY-MM-DD ────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  if (!fecha) {
    return NextResponse.json(
      { error: "Parámetro 'fecha' requerido (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const inicioDia = `${fecha}T00:00:00`;
  const finDia = `${fecha}T23:59:59`;

  // Obtener todos los barberos
  const { data: barberos, error: errorBarberos } = await (supabase as any)
    .from("users")
    .select("id, nombre_completo, email")
    .eq("rol", "barbero");

  if (errorBarberos) {
    return NextResponse.json({ error: errorBarberos.message }, { status: 500 });
  }

  // Obtener citas activas en esa fecha (RF-06: ocupado = pendiente o confirmada)
  const estadosOcupados: EstadoCita[] = ["pendiente", "confirmada"];

  const { data: citasActivas, error: errorCitas } = await (supabase as any)
    .from("appointments")
    .select("barbero_id, fecha_hora_inicio, estado")
    .gte("fecha_hora_inicio", inicioDia)
    .lte("fecha_hora_inicio", finDia)
    .in("estado", estadosOcupados);

  if (errorCitas) {
    return NextResponse.json({ error: errorCitas.message }, { status: 500 });
  }

  const barberoIdsOcupados = new Set(
    (citasActivas ?? []).map((c: { barbero_id: string }) => c.barbero_id),
  );

  const resultado = (barberos ?? []).map(
    (b: { id: string; nombre_completo: string; email: string }) => ({
      ...b,
      disponible: !barberoIdsOcupados.has(b.id),
    }),
  );

  return NextResponse.json({ barberos: resultado });
}

// ── POST /api/reservas ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { servicio_id, barbero_id, fecha_hora_inicio } = body;

  if (!servicio_id || !barbero_id || !fecha_hora_inicio) {
    return NextResponse.json(
      {
        error:
          "Faltan campos requeridos: servicio_id, barbero_id, fecha_hora_inicio",
      },
      { status: 400 },
    );
  }

  // Verificar disponibilidad antes de crear (protección race condition)
  const fechaSolo = fecha_hora_inicio.split("T")[0];
  const inicioDia = `${fechaSolo}T00:00:00`;
  const finDia = `${fechaSolo}T23:59:59`;

  const { data: conflicto } = await (supabase as any)
    .from("appointments")
    .select("id")
    .eq("barbero_id", barbero_id)
    .gte("fecha_hora_inicio", inicioDia)
    .lte("fecha_hora_inicio", finDia)
    .in("estado", ["pendiente", "confirmada"])
    .limit(1)
    .maybeSingle();

  if (conflicto) {
    return NextResponse.json(
      { error: "El barbero ya no está disponible en esa fecha" },
      { status: 409 },
    );
  }

  // Crear cita con estado inicial 'pendiente' (RF-07)
  const { data: nuevaCita, error } = await (supabase as any)
    .from("appointments")
    .insert({
      usuario_id: user.id,
      servicio_id,
      barbero_id,
      fecha_hora_inicio,
      estado: "pendiente" as EstadoCita,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cita: nuevaCita }, { status: 201 });
}
