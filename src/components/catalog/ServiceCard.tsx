// src/components/catalog/ServiceCard.tsx
// Tarjeta de servicio con badge Senior/Master — diseño mobile-first (RF-04)

import type { Service } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  onSeleccionar?: (service: Service) => void;
  /** Si es true muestra botón "Seleccionar", útil en el flujo de reserva */
  modoSeleccion?: boolean;
}

export default function ServiceCard({
  service,
  onSeleccionar,
  modoSeleccion = false,
}: ServiceCardProps) {
  const esMaster = service.variante_nivel === "Master";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Encabezado: nombre + badge variante */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-stone-900 leading-snug">
          {service.nombre}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${esMaster
              ? "bg-amber-100 text-amber-800"
              : "bg-stone-100 text-stone-600"
            }`}
        >
          {service.variante_nivel}
        </span>
      </div>

      {/* Descripción corta */}
      <p className="text-sm text-stone-500 leading-relaxed line-clamp-3">
        {service.descripcion_corta}
      </p>

      {/* Duración referencial (si existe) */}
      {service.duracion_minutos && (
        <p className="text-xs text-stone-400">
          ⏱ Aprox. {service.duracion_minutos} min
        </p>
      )}

      {/* Precio + acción */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-lg font-bold text-stone-900">
          {formatCurrency(service.precio_base)}
        </span>

        {modoSeleccion && onSeleccionar && (
          <button
            onClick={() => onSeleccionar(service)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Seleccionar
          </button>
        )}
      </div>
    </article>
  );
}