import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stock
 * 
 * Retorna todos los productos cuyo stock_actual <= stock_minimo.
 * Solo accesible para rol admin.
 * 
 * RF-23: Generar alerta cuando stock_actual <= stock_minimo
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  // Verificar autenticación y rol admin
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: profile } = (await (supabase as any)
    .from("users")
    .select("rol")
    .eq("id", authUser.id)
    .single()) as any;

  if (!profile || profile.rol !== "admin") {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  // Consultar productos en stock crítico
  // Supabase no soporta comparación entre columnas directamente en .filter(),
  // por lo que usamos .lte() con stock_minimo como referencia estática no es posible.
  // Se usa rpc o se traen todos y se filtra en backend.
  const { data: products, error } = (await (supabase as any)
    .from("products")
    .select("id, sku, nombre, categoria, stock_actual, stock_minimo, es_dropshipping")
    .order("stock_actual", { ascending: true })) as any;

  if (error) {
    return NextResponse.json(
      { error: "Error al consultar inventario." },
      { status: 500 }
    );
  }

  // Filtrar productos en alerta: stock_actual <= stock_minimo
  const enAlerta = ((products ?? []) as any[]).filter(
    (p) => p.stock_actual <= p.stock_minimo
  );

  return NextResponse.json(
    {
      alertas: enAlerta,
      total_alertas: enAlerta.length,
      // Separar físicos de dropshipping
      fisicos_en_alerta: enAlerta.filter((p) => !p.es_dropshipping).length,
    },
    { status: 200 }
  );
}