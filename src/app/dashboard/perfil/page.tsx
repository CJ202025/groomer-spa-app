"use client";
// src/app/dashboard/perfil/page.tsx
// Formulario editable de perfil: nombre_completo, telefono, dni_ce

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";

interface ProfileForm {
    nombre_completo: string;
    telefono: string;
    dni_ce: string;
}

export default function PerfilPage() {
    const supabase = createClient();

    const [profile, setProfile] = useState<ProfileForm>({
        nombre_completo: "",
        telefono: "",
        dni_ce: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data } = await (supabase as any)
                .from("users")
                .select("nombre_completo, telefono, dni_ce")
                .eq("id", user.id)
                .single();

            if (data) {
                setProfile({
                    nombre_completo: data.nombre_completo ?? "",
                    telefono: data.telefono ?? "",
                    dni_ce: data.dni_ce ?? "",
                });
            }
            setLoading(false);
        }

        loadProfile();
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError(null);
        setSuccessMsg(null);
    }

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!profile.nombre_completo.trim())
            newErrors.nombre_completo = "El nombre es obligatorio";
        if (profile.telefono && !/^\+?[\d\s\-]{7,15}$/.test(profile.telefono))
            newErrors.telefono = "Teléfono inválido";
        if (
            profile.dni_ce &&
            !/^\d{8}$|^[a-zA-Z0-9]{9,12}$/.test(profile.dni_ce)
        )
            newErrors.dni_ce = "DNI (8 dígitos) o CE (9-12 caracteres)";
        return newErrors;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        setFormError(null);
        setSuccessMsg(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setFormError("Sesión expirada. Por favor vuelve a iniciar sesión.");
            setSaving(false);
            return;
        }

        const { error } = await (supabase as any)
            .from("users")
            .update({
                nombre_completo: profile.nombre_completo.trim(),
                telefono: profile.telefono?.trim() || null,
                dni_ce: profile.dni_ce?.trim() || null,
            })
            .eq("id", user.id);

        setSaving(false);

        if (error) {
            setFormError("No se pudieron guardar los cambios. Intenta nuevamente.");
            return;
        }

        setSuccessMsg("Perfil actualizado correctamente.");
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <span className="text-stone-400 text-sm">Cargando perfil…</span>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-stone-900">Mi perfil</h1>
                <p className="mt-1 text-sm text-stone-500">
                    Actualiza tu información personal
                </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <FormError message={formError} />

                {successMsg && (
                    <div
                        role="status"
                        className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                    >
                        <span aria-hidden="true">✓</span>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <Input
                        label="Nombre completo"
                        name="nombre_completo"
                        type="text"
                        autoComplete="name"
                        value={profile.nombre_completo}
                        onChange={handleChange}
                        error={errors.nombre_completo}
                        required
                    />
                    <Input
                        label="Teléfono"
                        name="telefono"
                        type="tel"
                        autoComplete="tel"
                        value={profile.telefono}
                        onChange={handleChange}
                        error={errors.telefono}
                        hint="Ej. 999 888 777"
                    />
                    <Input
                        label="DNI / Carné de extranjería"
                        name="dni_ce"
                        type="text"
                        value={profile.dni_ce}
                        onChange={handleChange}
                        error={errors.dni_ce}
                        hint="DNI: 8 dígitos · CE: 9 a 12 caracteres"
                    />

                    <Button type="submit" loading={saving} fullWidth size="lg">
                        Guardar cambios
                    </Button>
                </form>
            </div>
        </div>
    );
}