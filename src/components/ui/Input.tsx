// src/components/ui/Input.tsx
// Input accesible con label integrado y estado de error

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, id, className = "", ...props }, ref) => {
        const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
        const errorId = `${inputId}-error`;
        const hintId = `${inputId}-hint`;

        return (
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-stone-700"
                >
                    {label}
                    {props.required && (
                        <span className="ml-1 text-amber-600" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>

                <input
                    ref={ref}
                    id={inputId}
                    aria-describedby={
                        [error ? errorId : "", hint ? hintId : ""]
                            .filter(Boolean)
                            .join(" ") || undefined
                    }
                    aria-invalid={!!error}
                    className={[
                        "w-full rounded-lg border px-4 py-2.5 text-base text-stone-900",
                        "bg-white placeholder:text-stone-400",
                        "transition-colors duration-150",
                        "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
                        error
                            ? "border-red-500 bg-red-50 focus:ring-red-400 focus:border-red-400"
                            : "border-stone-300 hover:border-stone-400",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        className,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    {...props}
                />

                {hint && !error && (
                    <p id={hintId} className="text-xs text-stone-500">
                        {hint}
                    </p>
                )}

                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="flex items-center gap-1 text-xs text-red-600 font-medium"
                    >
                        <span aria-hidden="true">⚠</span>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;