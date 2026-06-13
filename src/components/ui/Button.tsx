// src/components/ui/Button.tsx
// Botón reutilizable con variantes: primario, secundario, destructivo, ghost

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-amber-500 text-white font-semibold hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400 disabled:bg-amber-200",
    secondary:
        "bg-white text-stone-800 border border-stone-300 font-medium hover:bg-stone-50 active:bg-stone-100 focus:ring-stone-300 disabled:opacity-50",
    destructive:
        "bg-red-600 text-white font-semibold hover:bg-red-700 active:bg-red-800 focus:ring-red-400 disabled:bg-red-200",
    ghost:
        "bg-transparent text-stone-700 font-medium hover:bg-stone-100 active:bg-stone-200 focus:ring-stone-300 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-5 py-2.5 text-base rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            fullWidth = false,
            leftIcon,
            children,
            disabled,
            className = "",
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                aria-busy={loading}
                className={[
                    "inline-flex items-center justify-center gap-2",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "disabled:cursor-not-allowed select-none",
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth ? "w-full" : "",
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
                {...props}
            >
                {loading ? (
                    <>
                        <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        <span>Cargando…</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;