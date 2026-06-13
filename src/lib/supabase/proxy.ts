// src/lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    //
    // // INICIO MODIFICACION - Fase 2: Protección de rutas y redirección por roles
    //
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isProtectedRoute =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/checkout");

    const isAuthRoute =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/registro");

    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user) {
        if (isAuthRoute) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        if (isProtectedRoute) {
            // Se agregó as any para resolver "Property 'rol' does not exist on type 'never'"
            const { data: profile } = (await supabase
                .from("users")
                .select("rol")
                .eq("id", user.id)
                .single()) as any;

            const rol = profile?.rol;

            if (
                rol === "admin" &&
                request.nextUrl.pathname.startsWith("/dashboard")
            ) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }

            if (
                (rol === "cliente" || rol === "barbero") &&
                request.nextUrl.pathname.startsWith("/admin")
            ) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }
    // // FIN MODIFICACION
    //

    return supabaseResponse;
}