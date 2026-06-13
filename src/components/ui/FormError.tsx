// src/components/ui/FormError.tsx
// Mensaje de error a nivel de formulario (errores globales, no de campo)

interface FormErrorProps {
    message?: string | null;
}

export default function FormError({ message }: FormErrorProps) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            <span className="mt-0.5 shrink-0 text-red-500" aria-hidden="true">
                ✕
            </span>
            <p>{message}</p>
        </div>
    );
}