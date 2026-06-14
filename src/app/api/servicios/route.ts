// src/app/api/servicios/route.ts
// GET → catálogo público de servicios (RF-04)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: servicios, error } = await supabase
    .from("services")
    .select("*")
    .order("variante_nivel", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ servicios: servicios ?? [] });
}
