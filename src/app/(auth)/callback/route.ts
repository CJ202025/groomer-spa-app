// src/app/(auth)/callback/route.ts
// Maneja el redirect de Google OAuth y el flujo PKCE de Supabase

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Determinar redirección según rol
            const { data: profile } = await (supabase as any)
                .from("users")
                .select("rol")
                .eq("id", data.user.id)
                .single();

            const rol = profile?.rol ?? "cliente";
            const destination = rol === "admin" ? "/admin" : next;

            return NextResponse.redirect(`${origin}${destination}`);
        }
    }

    // Si hay error, redirigir a login con mensaje
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}