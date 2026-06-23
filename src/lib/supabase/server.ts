// src/lib/supabase/server.ts
// Cliente Supabase para uso en Server Components y Route Handlers

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
    const cookieStore = await cookies(); // cookies() es asíncrona

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll puede fallar en Server Components de solo lectura.
                        // Si hay middleware activo refrescando sesiones, este error es seguro de ignorar.
                    }
                },
            },
        }
    );
}

// Cliente con service role para operaciones administrativas (sin RLS)
// BUGFIX: No debe usar cookies(), porque si inyecta el JWT del usuario,
// Supabase aplicará RLS e ignorará el SERVICE_ROLE_KEY.
export async function createAdminClient() {
    return createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}