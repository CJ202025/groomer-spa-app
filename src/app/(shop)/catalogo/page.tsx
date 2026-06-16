// src/app/(shop)/catalogo/page.tsx
// Catálogo de productos — RF-09

import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/types/database";

// Forzar renderizado dinámico para obtener datos frescos de stock
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catálogo | Groomer SPA",
  description: "Productos de cuidado masculino: facial, barba y más.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  // Obtener todos los productos ordenados por categoría y nombre
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (error || !products) {
    return (
      <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
        <p className="text-center text-slate-500 py-20">
          No se pudo cargar el catálogo. Intenta nuevamente.
        </p>
      </main>
    );
  }

  // Extraer categorías únicas
  const categorias = Array.from(
    new Set(products.map((p: Product) => p.categoria))
  ).sort();

  // Filtrar por categoría si se seleccionó una
  const categoriaActiva = categoria ?? "todas";
  const productosFiltrados =
    categoriaActiva === "todas"
      ? products
      : products.filter((p: Product) => p.categoria === categoriaActiva);

  // Agrupar por categoría para la vista final
  const grupos: Record<string, Product[]> = {};
  for (const p of productosFiltrados as Product[]) {
    if (!grupos[p.categoria]) grupos[p.categoria] = [];
    grupos[p.categoria].push(p);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Catálogo de productos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} productos disponibles
          </p>
        </div>

        {/* Filtro por categoría — scrollable en mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide -mx-4 px-4">
          <CategoryChip
            label="Todas"
            value="todas"
            active={categoriaActiva === "todas"}
          />
          {categorias.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              value={cat}
              active={categoriaActiva === cat}
            />
          ))}
        </div>

        {/* Grid de productos por grupo */}
        {Object.keys(grupos).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">
              No hay productos en esta categoría.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grupos).map(([categoria, items]) => (
              <section key={categoria}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {categoria}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Chip de categoría ─────────────────────────────────────────────────────────

function CategoryChip({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <a
      href={`/catalogo${value !== "todas" ? `?categoria=${encodeURIComponent(value)}` : ""}`}
      className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {label}
    </a>
  );
}