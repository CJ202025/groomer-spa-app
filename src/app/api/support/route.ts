// src/app/api/support/route.ts
// Route Handler POST — Escalado de conversación a atención humana — RF-25 — Fase 8
// Recibe el contexto del chatbot cuando el usuario selecciona reclamo/cancelación compleja
// y notifica al administrador por email usando sendEmail.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";

// ── Tipo del payload de escalado ──────────────────────────────────────────────

interface EscaladoPayload {
  motivo: "cancelacion_compleja" | "reclamo" | "otro";
  mensaje: string;
  /** Email de contacto del usuario (puede ser anónimo) */
  emailContacto?: string;
  /** Nombre del usuario (puede ser anónimo) */
  nombreUsuario?: string;
}

// ── Labels legibles para el motivo ───────────────────────────────────────────

const MOTIVO_LABELS: Record<EscaladoPayload["motivo"], string> = {
  cancelacion_compleja: "Cancelación compleja de cita",
  reclamo: "Reclamo / Queja",
  otro: "Consulta general",
};

// ── POST /api/support ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: EscaladoPayload = await req.json();
    const { motivo, mensaje, emailContacto, nombreUsuario } = body;

    if (!motivo || !mensaje) {
      return NextResponse.json(
        { error: "Campos 'motivo' y 'mensaje' son requeridos" },
        { status: 400 }
      );
    }

    // Intentar obtener datos del usuario autenticado (si existe sesión)
    let emailUsuarioAuth: string | undefined;
    let nombreUsuarioAuth: string | undefined;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        emailUsuarioAuth = user.email ?? undefined;
        const { data: perfil } = await (supabase as any)
          .from("users")
          .select("nombre_completo")
          .eq("id", user.id)
          .single();
        nombreUsuarioAuth = perfil?.nombre_completo ?? undefined;
      }
    } catch (_) {
      // Ignorar errores de sesión — el soporte debe funcionar aunque no esté autenticado
    }

    const emailFinal = emailContacto ?? emailUsuarioAuth ?? "Desconocido";
    const nombreFinal = nombreUsuario ?? nombreUsuarioAuth ?? "Usuario anónimo";
    const motivoLabel = MOTIVO_LABELS[motivo] ?? motivo;
    const fechaEscalado = new Date().toLocaleString("es-PE", {
      dateStyle: "full",
      timeStyle: "short",
    });

    console.log(
      `[support] Escalado recibido — Motivo: ${motivoLabel} | Usuario: ${nombreFinal} <${emailFinal}>`
    );

    // ── Notificar al administrador por email ──────────────────────────────────

    const emailAdmin = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM_ADDRESS;

    if (emailAdmin) {
      const htmlAdmin = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Escalado de soporte</title></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <div style="background:#dc2626;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">🚨 Nuevo escalado de soporte</p>
      <p style="margin:6px 0 0;font-size:13px;color:#fecaca;">Groomer SPA — Atención requerida</p>
    </div>

    <div style="padding:32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;width:35%;">Motivo</td>
          <td style="padding:8px 0;font-weight:600;color:#dc2626;">${motivoLabel}</td>
        </tr>
        <tr style="border-top:1px solid #f3f4f6;">
          <td style="padding:8px 0;color:#6b7280;">Usuario</td>
          <td style="padding:8px 0;font-weight:600;">${nombreFinal}</td>
        </tr>
        <tr style="border-top:1px solid #f3f4f6;">
          <td style="padding:8px 0;color:#6b7280;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${emailFinal}" style="color:#4338ca;">${emailFinal}</a></td>
        </tr>
        <tr style="border-top:1px solid #f3f4f6;">
          <td style="padding:8px 0;color:#6b7280;">Fecha</td>
          <td style="padding:8px 0;">${fechaEscalado}</td>
        </tr>
      </table>

      <div style="margin-top:20px;padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">
          Mensaje del usuario
        </p>
        <p style="margin:0;font-size:14px;color:#1c1917;line-height:1.6;">${mensaje}</p>
      </div>

      <div style="margin-top:20px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin"
           style="display:inline-block;background:#1e1b4b;color:#fff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Ir al Panel de Admin →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim();

      await sendEmail(
        emailAdmin,
        `[Soporte] ${motivoLabel} — ${nombreFinal}`,
        htmlAdmin
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Tu solicitud fue recibida. Un agente se pondrá en contacto contigo pronto.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[support] Error procesando escalado:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la solicitud de soporte" },
      { status: 500 }
    );
  }
}
