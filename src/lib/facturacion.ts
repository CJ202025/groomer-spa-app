// src/lib/facturacion.ts
// Generación de Boleta Electrónica simulada en PDF — RF-15
// Usa jsPDF (sin dependencias nativas, compatible con Next.js server)

import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ItemBoleta {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface DatosBoleta {
  numero_orden: string;
  fecha: string;
  cliente_nombre: string;
  cliente_email: string;
  items: ItemBoleta[];
  subtotal: number;
  costo_envio: number;
  total: number;
  metodo_envio: string;
}

// ── Generador de PDF ──────────────────────────────────────────────────────────

/**
 * Genera el PDF de la boleta electrónica simulada.
 * No conecta con SUNAT/OSE real — es una simulación del formato.
 */
function generarPDF(datos: DatosBoleta): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margen = 20;
  let y = margen;

  // ── Encabezado ─────────────────────────────────────────────────────────────

  // Franja superior oscura
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("GROOMER SPA", margen, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Barbería & Spa para el Hombre Moderno", margen, 19);
  doc.text("RUC: 20000000001 (Simulación)", margen, 25);

  // Tipo de documento
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(130, 4, 62, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BOLETA ELECTRÓNICA", 161, 11, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${datos.numero_orden.substring(0, 8).toUpperCase()}`, 161, 18, { align: "center" });

  y = 38;
  doc.setTextColor(30, 30, 30);

  // ── Datos del documento ────────────────────────────────────────────────────

  doc.setFillColor(248, 248, 248);
  doc.rect(margen, y, 170, 22, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA DE EMISIÓN:", margen + 3, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(datos.fecha, margen + 40, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", margen + 3, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(datos.cliente_nombre, margen + 22, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text("EMAIL:", margen + 95, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(datos.cliente_email, margen + 108, y + 15);

  y += 30;

  // ── Tabla de ítems ─────────────────────────────────────────────────────────

  // Encabezado tabla
  doc.setFillColor(30, 30, 30);
  doc.rect(margen, y, 170, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPCIÓN", margen + 3, y + 5.5);
  doc.text("CANT.", 130, y + 5.5, { align: "center" });
  doc.text("P. UNIT.", 155, y + 5.5, { align: "right" });
  doc.text("SUBTOTAL", margen + 168, y + 5.5, { align: "right" });

  y += 8;
  doc.setTextColor(30, 30, 30);

  // Filas de ítems
  datos.items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margen, y, 170, 8, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Truncar nombre si es muy largo
    const nombreCorto = item.nombre.length > 45 ? item.nombre.substring(0, 45) + "…" : item.nombre;
    doc.text(nombreCorto, margen + 3, y + 5.5);
    doc.text(String(item.cantidad), 130, y + 5.5, { align: "center" });
    doc.text(`S/ ${item.precio_unitario.toFixed(2)}`, 155, y + 5.5, { align: "right" });
    doc.text(`S/ ${item.subtotal.toFixed(2)}`, margen + 168, y + 5.5, { align: "right" });

    y += 8;
  });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margen, y, margen + 170, y);
  y += 8;

  // ── Totales ────────────────────────────────────────────────────────────────

  const colLabel = 130;
  const colValue = margen + 168;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", colLabel, y, { align: "right" });
  doc.text(`S/ ${datos.subtotal.toFixed(2)}`, colValue, y, { align: "right" });
  y += 6;

  doc.text(`Envío (${datos.metodo_envio.replace("_", " ")}):`, colLabel, y, { align: "right" });
  doc.text(
    datos.costo_envio === 0 ? "Gratis" : `S/ ${datos.costo_envio.toFixed(2)}`,
    colValue, y, { align: "right" }
  );
  y += 8;

  // Total en caja
  doc.setFillColor(245, 158, 11);
  doc.rect(margen + 90, y - 5, 80, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL A PAGAR:", colLabel, y + 2, { align: "right" });
  doc.text(`S/ ${datos.total.toFixed(2)}`, colValue, y + 2, { align: "right" });

  y += 18;
  doc.setTextColor(30, 30, 30);

  // ── Método de pago ─────────────────────────────────────────────────────────

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setFillColor(240, 253, 244);
  doc.rect(margen, y, 170, 10, "F");
  doc.setTextColor(22, 101, 52);
  doc.text("✓ PAGO APROBADO — Procesado mediante Culqi Sandbox (Simulación)", margen + 3, y + 6.5);

  y += 18;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text(
    "Este documento es una SIMULACIÓN de boleta electrónica generada con fines de desarrollo.",
    105, y, { align: "center" }
  );
  doc.text(
    "No tiene validez tributaria ante SUNAT. Groomer SPA — groomer.pe",
    105, y + 5, { align: "center" }
  );

  // Retornar como Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// ── Función principal exportada ────────────────────────────────────────────────

/**
 * Genera la boleta electrónica simulada para un pedido:
 * 1. Consulta la orden y sus ítems en Supabase
 * 2. Genera el PDF con jsPDF
 * 3. Sube el PDF al bucket "boletas" en Supabase Storage
 * 4. Actualiza el campo `boleta_url` en la orden
 *
 * @param orderId - UUID de la orden en la tabla `orders`
 * @returns URL pública del PDF en Supabase Storage
 */
export async function generarBoleta(orderId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Usamos el Service Role Key para saltarnos RLS, ya que esto corre
  // en un webhook y no tiene la sesión (cookies) del usuario.
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Obtener datos de la orden
  const { data: orden, error: errorOrden } = await (supabase as any)
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (errorOrden || !orden) {
    console.error("[facturacion] Error obteniendo orden:", errorOrden);
    return null;
  }

  // 2. Obtener ítems de la orden con datos del producto
  const { data: items, error: errorItems } = await (supabase as any)
    .from("order_items")
    .select("*, products(nombre, precio)")
    .eq("pedido_id", orderId);

  if (errorItems || !items) {
    console.error("[facturacion] Error obteniendo items:", errorItems);
    return null;
  }

  // 3. Obtener datos del cliente
  const { data: cliente } = await (supabase as any)
    .from("users")
    .select("nombre_completo, email")
    .eq("id", orden.usuario_id)
    .single();

  // 4. Preparar datos para el PDF
  const fechaFormateada = new Date(orden.created_at ?? Date.now()).toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsBoleta: ItemBoleta[] = items.map((item: any) => ({
    nombre: item.products?.nombre ?? `Producto (${item.producto_id?.substring(0, 8) ?? "N/A"})`,
    cantidad: item.cantidad,
    precio_unitario: item.products?.precio ?? (item.subtotal / item.cantidad),
    subtotal: item.subtotal,
  }));

  const datosBoleta: DatosBoleta = {
    numero_orden: orderId,
    fecha: fechaFormateada,
    cliente_nombre: cliente?.nombre_completo ?? "Cliente",
    cliente_email: cliente?.email ?? orden.usuario_id,
    items: itemsBoleta,
    subtotal: orden.subtotal,
    costo_envio: orden.costo_envio,
    total: orden.total,
    metodo_envio: orden.metodo_envio,
  };

  // 5. Generar el PDF
  const pdfBuffer = generarPDF(datosBoleta);

  // 6. Subir a Supabase Storage
  const nombreArchivo = `boleta_${orderId}_${Date.now()}.pdf`;
  const { error: errorUpload } = await (supabase as any).storage
    .from("boletas")
    .upload(nombreArchivo, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (errorUpload) {
    console.error("[facturacion] Error subiendo PDF:", errorUpload);
    return null;
  }

  // 7. Obtener URL pública
  const { data: urlData } = (supabase as any).storage
    .from("boletas")
    .getPublicUrl(nombreArchivo);

  const boletaUrl: string = urlData?.publicUrl ?? null;

  // 8. Actualizar la orden con la URL de la boleta
  if (boletaUrl) {
    await (supabase as any)
      .from("orders")
      .update({ boleta_url: boletaUrl })
      .eq("id", orderId);
  }

  return boletaUrl;
}
