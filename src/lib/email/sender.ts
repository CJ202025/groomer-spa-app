// src/lib/email/sender.ts
// Función genérica sendEmail — RF-26 — Fase 8
// Proveedor: Resend (integración nativa con Next.js)
// Requiere: EMAIL_API_KEY y EMAIL_FROM_ADDRESS en .env.local

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Envía un email transaccional usando la API de Resend.
 * Si EMAIL_API_KEY no está configurada, loga en consola y no falla
 * el flujo principal (fire-and-forget seguro para desarrollo).
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS ?? "noreply@groomerspa.com";

  // Modo sin configurar: solo log en consola (desarrollo local)
  if (!apiKey) {
    console.log(
      `[email] (sin API KEY) Para: ${to} | Asunto: "${subject}"`
    );
    console.log(`[email] HTML preview:\n${html.replace(/<[^>]+>/g, "").slice(0, 200)}...`);
    return { success: true, id: "dev-mode-no-api-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[email] Error de Resend:", data);
      return { success: false, error: data?.message ?? "Error desconocido" };
    }

    console.log(`[email] Enviado exitosamente a ${to}. ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("[email] Error de red al enviar email:", err?.message ?? err);
    return { success: false, error: err?.message ?? "Error de red" };
  }
}
