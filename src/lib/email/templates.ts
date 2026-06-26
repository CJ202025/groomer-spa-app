// src/lib/email/templates.ts
// Funciones generadoras de HTML para emails transaccionales — RF-26 — Fase 8
// Tres eventos: registro de usuario, confirmación de cita, actualización de pedido

// ── Tipos auxiliares ──────────────────────────────────────────────────────────

export interface CitaEmailData {
  servicio: string;
  barbero: string;
  fecha: string; // Ejemplo: "Lunes 30 de junio de 2026"
  hora: string;  // Ejemplo: "10:30 AM"
  estado: string;
}

export interface PedidoEmailData {
  numeroPedido: string;
  total: number;
  estadoAnterior?: string;
  nuevoEstado: string;
  metodoEnvio?: string;
}

// ── Helper base para el wrapper visual del email ──────────────────────────────

function wrapEmailBase(contenido: string, titulo: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Groomer<span style="color:#a5b4fc;">SPA</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#c7d2fe;letter-spacing:0.5px;text-transform:uppercase;">
                Barbería & Spa para el hombre moderno
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:40px;">
              ${contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Este correo fue enviado automáticamente por Groomer SPA.<br/>
                Si tienes dudas, responde a este email o contáctanos por WhatsApp.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">
                © ${new Date().getFullYear()} Groomer SPA. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Template 1: Bienvenida al registrarse ─────────────────────────────────────

/**
 * Genera el HTML del email de bienvenida tras el registro.
 * RF-26: Evento 1 — nuevo usuario registrado.
 */
export function templateBienvenida(nombre: string): string {
  const nombreMostrado = nombre || "Cliente";

  const contenido = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">
      ¡Bienvenido, ${nombreMostrado}! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      Tu cuenta en <strong style="color:#4338ca;">Groomer SPA</strong> ha sido creada exitosamente.
      Estamos felices de tenerte con nosotros.
    </p>

    <div style="background:#f0f0fe;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4338ca;text-transform:uppercase;letter-spacing:0.5px;">
        ¿Qué puedes hacer ahora?
      </p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:2;">
        <li>Reservar una cita con nuestros barberos Senior y Master</li>
        <li>Explorar nuestro catálogo de productos de cuidado personal</li>
        <li>Acumular <strong>Groomer Credits</strong> con cada compra</li>
        <li>Activar tu membresía <strong>Groomer Elite</strong> y obtener 15% de descuento</li>
      </ul>
    </div>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);color:#ffffff;
                font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;
                border-radius:8px;letter-spacing:0.2px;">
        Ir a mi cuenta →
      </a>
    </div>
  `;

  return wrapEmailBase(contenido, "Bienvenido a Groomer SPA");
}

// ── Template 2: Confirmación de cita ─────────────────────────────────────────

/**
 * Genera el HTML del email de confirmación de cita.
 * RF-26: Evento 2 — cita confirmada.
 */
export function templateConfirmacionCita(cita: CitaEmailData): string {
  const badgeColor =
    cita.estado === "confirmada"
      ? "#16a34a"
      : cita.estado === "pendiente"
      ? "#d97706"
      : "#4338ca";

  const contenido = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">
      Tu cita ha sido confirmada ✂️
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      Te informamos que el estado de tu cita ha sido actualizado.
      Aquí tienes los detalles:
    </p>

    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#1e1b4b;padding:12px 20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#c7d2fe;text-transform:uppercase;letter-spacing:0.5px;">
          Detalle de la cita
        </p>
      </div>
      <div style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#64748b;width:40%;">Servicio</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${cita.servicio}</td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Barbero</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${cita.barbero}</td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Fecha</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${cita.fecha}</td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Hora</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${cita.hora}</td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Estado</td>
            <td style="padding:8px 0;">
              <span style="display:inline-block;background:${badgeColor};color:#ffffff;
                           font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;
                           text-transform:uppercase;letter-spacing:0.5px;">
                ${cita.estado}
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.5;">
        ⚠️ <strong>Recuerda:</strong> Si necesitas cancelar, hazlo con al menos <strong>24 horas de anticipación</strong>
        para evitar una penalidad del 50%.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/citas"
         style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);color:#ffffff;
                font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;
                border-radius:8px;">
        Ver mis citas →
      </a>
    </div>
  `;

  return wrapEmailBase(contenido, "Confirmación de cita — Groomer SPA");
}

// ── Template 3: Actualización de estado de pedido ────────────────────────────

const ESTADO_LABELS: Record<string, string> = {
  confirmado: "Confirmado",
  en_preparacion: "En Preparación",
  completado: "Completado",
};

const ESTADO_ICONS: Record<string, string> = {
  confirmado: "✅",
  en_preparacion: "📦",
  completado: "🎉",
};

const ESTADO_COLORS: Record<string, string> = {
  confirmado: "#4338ca",
  en_preparacion: "#d97706",
  completado: "#16a34a",
};

/**
 * Genera el HTML del email de actualización de estado de pedido.
 * RF-26: Evento 3 — estado de pedido actualizado por admin.
 */
export function templateActualizacionPedido(
  pedido: PedidoEmailData
): string {
  const estadoLabel =
    ESTADO_LABELS[pedido.nuevoEstado] ?? pedido.nuevoEstado;
  const estadoIcon = ESTADO_ICONS[pedido.nuevoEstado] ?? "📋";
  const estadoColor = ESTADO_COLORS[pedido.nuevoEstado] ?? "#4338ca";

  const totalFormateado = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(pedido.total);

  const contenido = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">
      ${estadoIcon} Actualización de tu pedido
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      El estado de tu pedido <strong style="color:#1e293b;">#${pedido.numeroPedido.slice(0, 8).toUpperCase()}</strong> ha sido actualizado.
    </p>

    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#1e1b4b;padding:12px 20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#c7d2fe;text-transform:uppercase;letter-spacing:0.5px;">
          Detalle del pedido
        </p>
      </div>
      <div style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#64748b;width:40%;">N° de pedido</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;font-family:monospace;">
              ${pedido.numeroPedido.slice(0, 8).toUpperCase()}
            </td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Total</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${totalFormateado}</td>
          </tr>
          ${
            pedido.metodoEnvio
              ? `
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Envío</td>
            <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${pedido.metodoEnvio}</td>
          </tr>`
              : ""
          }
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:14px;color:#64748b;">Nuevo estado</td>
            <td style="padding:8px 0;">
              <span style="display:inline-block;background:${estadoColor};color:#ffffff;
                           font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;
                           text-transform:uppercase;letter-spacing:0.5px;">
                ${estadoLabel}
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    ${
      pedido.nuevoEstado === "completado"
        ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#14532d;line-height:1.5;">
        🎉 <strong>¡Tu pedido fue entregado!</strong> Recuerda que puedes descargarte la boleta desde tu historial de pedidos.
        Y si te gustó el servicio, no olvides que dejar una <strong>reseña te otorga +30 Groomer Credits</strong>.
      </p>
    </div>`
        : pedido.nuevoEstado === "en_preparacion"
        ? `
    <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#7c2d12;line-height:1.5;">
        📦 <strong>¡Tu pedido está siendo preparado!</strong> Nuestro equipo ya está alistando tus productos para el envío.
      </p>
    </div>`
        : ""
    }

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/pedidos"
         style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);color:#ffffff;
                font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;
                border-radius:8px;">
        Ver mis pedidos →
      </a>
    </div>
  `;

  return wrapEmailBase(contenido, `Pedido ${ESTADO_LABELS[pedido.nuevoEstado] ?? pedido.nuevoEstado} — Groomer SPA`);
}
