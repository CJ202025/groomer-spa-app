"use client";
// src/app/(auth)/registro/page.tsx
// Formulario de registro con email+contraseña y OAuth Google

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export default function RegistroPage() {
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({
        nombre_completo: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Limpiar error del campo al escribir
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError(null);
    }

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.nombre_completo.trim())
            newErrors.nombre_completo = "Tu nombre es obligatorio";
        if (!form.email.trim()) newErrors.email = "El correo es obligatorio";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Correo inválido";
        if (!form.password) newErrors.password = "La contraseña es obligatoria";
        else if (form.password.length < 8)
            newErrors.password = "Mínimo 8 caracteres";
        if (form.password !== form.confirmPassword)
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        return newErrors;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setFormError(null);

        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: { full_name: form.nombre_completo },
                emailRedirectTo: `${window.location.origin}/callback`,
            },
        });

        setLoading(false);

        if (error) {
            setFormError(
                error.message === "User already registered"
                    ? "Ya existe una cuenta con ese correo. Intenta iniciar sesión."
                    : "No se pudo crear la cuenta. Intenta nuevamente."
            );
            return;
        }

        router.push("/dashboard");
    }

    async function handleGoogleSignIn() {
        setLoadingGoogle(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/callback`,
            },
        });
        if (error) {
            setFormError("No se pudo conectar con Google. Intenta nuevamente.");
            setLoadingGoogle(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
            {/* Marca */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900">
                    Groomer <span className="text-amber-500">SPA</span>
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                    Crea tu cuenta y empieza a reservar
                </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
                <h2 className="mb-6 text-xl font-semibold text-stone-900">
                    Crear cuenta
                </h2>

                <FormError message={formError} />

                <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
                    <Input
                        label="Nombre completo"
                        name="nombre_completo"
                        type="text"
                        autoComplete="name"
                        value={form.nombre_completo}
                        onChange={handleChange}
                        error={errors.nombre_completo}
                        required
                    />
                    <Input
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                    <Input
                        label="Contraseña"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        error={errors.password}
                        hint="Mínimo 8 caracteres"
                        required
                    />
                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        required
                    />

                    <Button
                        type="submit"
                        loading={loading}
                        fullWidth
                        size="lg"
                        className="mt-2"
                    >
                        Crear cuenta
                    </Button>
                </form>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-stone-200" />
                    </div>
                    <div className="relative flex justify-center text-xs text-stone-400">
                        <span className="bg-white px-3">o continúa con</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    loading={loadingGoogle}
                    leftIcon={<GoogleIcon />}
                    onClick={handleGoogleSignIn}
                >
                    Continuar con Google
                </Button>

                <p className="mt-6 text-center text-sm text-stone-500">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2"
                    >
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}