// src/app/api/gestion-citas/route.ts
// GET → citas para gestión según rol: barbero (las suyas) o admin (todas) (RF-07, RF-03)
// MODIFICACIÓN FASE 6 — incluir es_miembro_elite del cliente para badge de prioridad (RF-20)

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database";
import * as fs from "fs";
import * as path from "path";

function logDebug(msg: string) {
  try {
    fs.appendFileSync(path.join(process.cwd(), "debug.log"), `[gestion-citas] ${new Date().toISOString()} - ${msg}\n`);
    console.log(`[gestion-citas] ${msg}`);
  } catch (e) {}
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Usamos adminClient para la query principal para que el join con la
  // tabla users (cliente:usuario_id) no sea bloqueado por RLS cuando quien
  // consulta es un barbero o admin (que no puede leer filas ajenas con el
  // cliente normal). La verificación de sesión y rol ya ocurrió arriba.
  const adminClient = await createAdminClient();

  // Query base con relaciones
  let query = (adminClient as any)
    .from("appointments")
    .select(
      `
      id,
      fecha_hora_inicio,
      estado,
      services:servicio_id ( nombre, precio_base, variante_nivel ),
      cliente:usuario_id ( nombre_completo, email, es_miembro_elite ),
      barbero:barbero_id ( id, nombre_completo, email )
    `,
    )
    .order("fecha_hora_inicio", { ascending: false });

  // Barbero solo ve sus citas asignadas
  if (rol === "barbero") {
    query = query.eq("barbero_id", user.id);
  }

  logDebug(`Rol del usuario: ${rol}, ID: ${user.id}`);

  const { data: citas, error } = await query;

  if (error) {
    logDebug(`Error en query: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logDebug(`Se encontraron ${citas?.length || 0} citas.`);
  if (citas && citas.length > 0) {
     logDebug(`Primera cita raw: ${JSON.stringify(citas[0])}`);
  }

  const citasNormalizadas = (citas ?? []).map((c: any) => ({
    id: c.id,
    fecha_hora_inicio: c.fecha_hora_inicio,
    estado: c.estado,
    servicio: c.services ?? null,
    // MODIFICACIÓN FASE 6 — inicio
    cliente: c.cliente
      ? {
          nombre_completo: c.cliente.nombre_completo,
          email: c.cliente.email,
          es_miembro_elite: c.cliente.es_miembro_elite ?? false,
        }
      : null,
    // MODIFICACIÓN FASE 6 — fin
    barbero: c.barbero ?? null,
  }));

  return NextResponse.json({ citas: citasNormalizadas, rol });
}
