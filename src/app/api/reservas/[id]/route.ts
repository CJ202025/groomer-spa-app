// src/app/api/reservas/[id]/route.ts
// PATCH → cambiar estado de una cita con control de rol (RF-07, RF-03)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EstadoCita, Rol } from "@/types/database";

const TRANSICIONES_VALIDAS: Record<EstadoCita, EstadoCita[]> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["completada", "cancelada"],
  completada: [],
  cancelada: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener rol del usuario solicitante
  const { data: perfil } = await (supabase as any)
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  const rol: Rol = perfil?.rol ?? "cliente";

  const body = await request.json();
  const nuevoEstado: EstadoCita = body.estado;

  if (!nuevoEstado) {
    return NextResponse.json(
      { error: "Campo 'estado' requerido" },
      { status: 400 },
    );
  }

  // Obtener la cita actual
  const { data: cita, error: errorCita } = await (supabase as any)
    .from("appointments")
    .select("id, estado, usuario_id, servicio_id, barbero_id")
    .eq("id", id)
    .single();

  if (errorCita || !cita) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  // Control de acceso por rol (RF-03, RF-07)
  const esCliente = rol === "cliente";
  const esPropietario = cita.usuario_id === user.id;

  if (esCliente) {
    if (!esPropietario) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (nuevoEstado !== "cancelada") {
      return NextResponse.json(
        { error: "El cliente solo puede cancelar citas" },
        { status: 403 },
      );
    }
  } else if (rol === "barbero") {
    if (cita.barbero_id !== user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
  }

  // Validar transición
  const transicionesPermitidas =
    TRANSICIONES_VALIDAS[cita.estado as EstadoCita];
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    return NextResponse.json(
      { error: `Transición inválida: ${cita.estado} → ${nuevoEstado}` },
      { status: 422 },
    );
  }

  // Actualizar estado (RF-06: barbero queda libre al pasar a 'completada')
  const { data: citaActualizada, error: errorUpdate } = await (supabase as any)
    .from("appointments")
    .update({ estado: nuevoEstado })
    .eq("id", id)
    .select()
    .single();

  if (errorUpdate) {
    return NextResponse.json({ error: errorUpdate.message }, { status: 500 });
  }

  return NextResponse.json({ cita: citaActualizada });
}
