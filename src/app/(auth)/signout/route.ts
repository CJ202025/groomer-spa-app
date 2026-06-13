// src/app/auth/signout/route.ts
// Endpoint para cerrar sesión y redirigir al login

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}