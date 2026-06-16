// src/app/admin/inventario/page.tsx
// Vista de inventario para admin — RF-12 (diferenciación físico vs dropshipping)

import { createClient } from "@/lib/supabase/server";
import { Package, Truck, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventario | Admin — Groomer SPA",
};

export default async function InventarioPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (error || !products) {
    return (
      <div className="p-6 text-slate-500 text-sm">
        Error cargando inventario.
      </div>
    );
  }

  const fisicos = (products as Product[]).filter((p) => !p.es_dropshipping);
  const dropshipping = (products as Product[]).filter((p) => p.es_dropshipping);
  const alertas = fisicos.filter((p) => p.stock_actual <= p.stock_minimo);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Inventario</h1>
      <p className="text-sm text-slate-500 mb-6">
        {products.length} productos totales · {fisicos.length} en stock físico ·{" "}
        {dropshipping.length} dropshipping
      </p>

      {/* Alertas de stock mínimo (se ampliará en Fase 7) */}
      {alertas.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            {alertas.length} producto{alertas.length !== 1 ? "s" : ""} con stock
            crítico
          </div>
          <ul className="text-sm text-red-600 space-y-1 pl-6">
            {alertas.map((p) => (
              <li key={p.id} className="list-disc">
                <strong>{p.nombre}</strong> — stock actual: {p.stock_actual} /{" "}
                mínimo: {p.stock_minimo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sección: Stock físico */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Stock físico ({fisicos.length})
          </h2>
        </div>
        <ProductTable products={fisicos} mostrarStock />
      </section>

      {/* Sección: Dropshipping */}
      {dropshipping.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Dropshipping ({dropshipping.length})
            </h2>
          </div>
          <ProductTable products={dropshipping} mostrarStock={false} />
        </section>
      )}
    </div>
  );
}

// ── Tabla de productos ────────────────────────────────────────────────────────

function ProductTable({
  products,
  mostrarStock,
}: {
  products: Product[];
  mostrarStock: boolean;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4">
        No hay productos en esta categoría.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-right px-4 py-3">Precio</th>
              {mostrarStock && (
                <>
                  <th className="text-right px-4 py-3">Stock actual</th>
                  <th className="text-right px-4 py-3">Stock mín.</th>
                  <th className="text-center px-4 py-3">Estado</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p) => {
              const critico = mostrarStock && p.stock_actual <= p.stock_minimo;
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    critico ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {p.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatCurrency(p.precio)}
                  </td>
                  {mostrarStock && (
                    <>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          critico ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {p.stock_actual}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {p.stock_minimo}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.stock_actual === 0 ? (
                          <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Sin stock
                          </span>
                        ) : critico ? (
                          <span className="inline-block text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}