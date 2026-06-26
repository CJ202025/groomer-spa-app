// src/app/api/reservas/[id]/route.ts
// PATCH → cambiar estado de una cita con control de rol (RF-07, RF-03)
// MODIFICACIÓN FASE 6 — acumulación de Groomer Credits al completar cita (RF-16)
// MODIFICACIÓN FASE 8 — email de confirmación de cita al confirmar (RF-26)

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { EstadoCita, Rol } from "@/types/database";
import * as fs from "fs";
import * as path from "path";
// MODIFICACIÓN FASE 8 — inicio
import { sendEmail } from "@/lib/email/sender";
import { templateConfirmacionCita } from "@/lib/email/templates";
// MODIFICACIÓN FASE 8 — fin

function logDebug(msg: string) {
  try {
    fs.appendFileSync(path.join(process.cwd(), "debug.log"), `[reservas] ${new Date().toISOString()} - ${msg}\n`);
    console.log(`[reservas] ${msg}`);
  } catch (e) {}
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // MODIFICACIÓN FASE 6 — inicio
  // RF-16: acumular créditos al dueño de la cita cuando el estado cambia a 'completada'
  if (nuevoEstado === "completada" && cita.servicio_id) {
    // BUGFIX: usar adminClient para TODAS las queries de este bloque.
    // La query de services con el cliente del barbero puede ser bloqueada por RLS,
    // retornando null y saltando silenciosamente todo el bloque de créditos.
    const adminClient = await createAdminClient();

    // Consultar precio_base del servicio (con adminClient para bypassear RLS)
    const { data: servicio, error: errorServicio } = await (adminClient as any)
      .from("services")
      .select("precio_base")
      .eq("id", cita.servicio_id)
      .single();

    if (errorServicio) {
      console.error(`[reservas/${id}] No se pudo leer el servicio ${cita.servicio_id}:`, errorServicio);
    }

    if (servicio?.precio_base) {
      const creditosGanados = Math.floor(servicio.precio_base);
      logDebug(`Precio base encontrado: ${servicio.precio_base}, Créditos a ganar: ${creditosGanados}`);

      const { data: perfilDueno, error: errorPerfil } = await (adminClient as any)
        .from("users")
        .select("groomer_credits")
        .eq("id", cita.usuario_id)
        .single();
        
      if (errorPerfil) logDebug(`Error leyendo perfil: ${errorPerfil.message}`);

      const creditosActuales: number = perfilDueno?.groomer_credits ?? 0;
      const nuevosSaldo = creditosActuales + creditosGanados;
      logDebug(`Créditos actuales: ${creditosActuales}, Nuevos: ${nuevosSaldo} para usuario ${cita.usuario_id}`);

      const { error: errorCreditos } = await (adminClient as any)
        .from("users")
        .update({ groomer_credits: nuevosSaldo })
        .eq("id", cita.usuario_id);

      if (errorCreditos) {
        logDebug(`ERROR actualizando créditos: ${JSON.stringify(errorCreditos)}`);
      } else {
        logDebug(`Cita completada. Créditos otorgados al usuario ${cita.usuario_id}: +${creditosGanados} pts. Total: ${nuevosSaldo}`);
      }
    } else {
      logDebug(`El servicio no tiene precio_base o no se encontró. data: ${JSON.stringify(servicio)}`);
    }
  }
  // MODIFICACIÓN FASE 6 — fin

  // MODIFICACIÓN FASE 8 — inicio
  // RF-26: Enviar email de confirmación de cita cuando el estado cambia a 'confirmada'
  if (nuevoEstado === "confirmada") {
    try {
      const adminClient = await createAdminClient();

      // Obtener datos completos de la cita: usuario, servicio, barbero
      const { data: citaCompleta } = await (adminClient as any)
        .from("appointments")
        .select(`
          fecha_hora_inicio,
          services(nombre),
          barberoUser:users!appointments_barbero_id_fkey(nombre_completo),
          clienteUser:users!appointments_usuario_id_fkey(email, nombre_completo)
        `)
        .eq("id", id)
        .single();

      if (citaCompleta?.clienteUser?.email) {
        const fechaObj = new Date(citaCompleta.fecha_hora_inicio);
        const fechaFormateada = fechaObj.toLocaleDateString("es-PE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const horaFormateada = fechaObj.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        });

        sendEmail(
          citaCompleta.clienteUser.email,
          "Tu cita en Groomer SPA ha sido confirmada ✂️",
          templateConfirmacionCita({
            servicio: citaCompleta.services?.nombre ?? "Servicio",
            barbero: citaCompleta.barberoUser?.nombre_completo ?? "Nuestro especialista",
            fecha: fechaFormateada,
            hora: horaFormateada,
            estado: "confirmada",
          })
        ).catch((err) =>
          console.error("[reservas/id] Error enviando email de confirmación de cita:", err)
        );
      }
    } catch (emailErr) {
      console.error("[reservas/id] Error preparando email de confirmación:", emailErr);
    }
  }
  // MODIFICACIÓN FASE 8 — fin

  return NextResponse.json({ cita: citaActualizada });
}
