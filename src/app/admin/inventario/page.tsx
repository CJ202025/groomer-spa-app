"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";

interface StockAlertSummary {
  alertas: Product[];
  total_alertas: number;
  fisicos_en_alerta: number;
}

interface EditState {
  stock_actual: number;
  stock_minimo: number;
}

export default function AdminInventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alertSummary, setAlertSummary] = useState<StockAlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDropshipping, setFilterDropshipping] = useState<"todos" | "fisico" | "dropshipping">("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditState>({ stock_actual: 0, stock_minimo: 0 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [productsRes, alertRes] = await Promise.all([
      supabase.from("products").select("*").order("nombre"),
      fetch("/api/stock"),
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);

    if (alertRes.ok) {
      const data = await alertRes.json();
      setAlertSummary(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isEnAlerta = (product: Product) => product.stock_actual <= product.stock_minimo;

  const filteredProducts = products.filter((p) => {
    if (filterDropshipping === "fisico") return !p.es_dropshipping;
    if (filterDropshipping === "dropshipping") return p.es_dropshipping;
    return true;
  });

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditValues({ stock_actual: product.stock_actual, stock_minimo: product.stock_minimo });
    setSaveError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const saveStock = async (productId: string) => {
    if (editValues.stock_actual < 0 || editValues.stock_minimo < 0) {
      setSaveError("Los valores no pueden ser negativos.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("products")
      .update({
        stock_actual: editValues.stock_actual,
        stock_minimo: editValues.stock_minimo,
      })
      .eq("id", productId);

    if (error) {
      setSaveError("No se pudo guardar. Intenta de nuevo.");
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stock_actual: editValues.stock_actual, stock_minimo: editValues.stock_minimo }
            : p
        )
      );
      // Refrescar alertas
      const alertRes = await fetch("/api/stock");
      if (alertRes.ok) setAlertSummary(await alertRes.json());
      setEditingId(null);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Inventario</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Control de stock físico y dropshipping con alertas automáticas.
        </p>
      </div>

      {/* Banners de alerta de stock crítico (RF-23) */}
      {alertSummary && alertSummary.total_alertas > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-red-400 font-semibold text-sm">
                {alertSummary.total_alertas} producto{alertSummary.total_alertas !== 1 ? "s" : ""} en stock crítico
              </p>
              <p className="text-red-400/70 text-xs mt-0.5">
                {alertSummary.fisicos_en_alerta} físico{alertSummary.fisicos_en_alerta !== 1 ? "s" : ""} requieren reabastecimiento.
                Los productos marcados con{" "}
                <span className="font-semibold text-red-400">⚠</span>{" "}
                están por debajo de su stock mínimo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { value: "todos", label: "Todos" },
          { value: "fisico", label: "Stock propio" },
          { value: "dropshipping", label: "Dropshipping" },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterDropshipping(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filterDropshipping === opt.value
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
              }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-500 self-center">
          {filteredProducts.length} productos
        </span>
      </div>

      {/* Error de guardado */}
      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      {/* Tabla desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              <th className="px-4 py-3 text-left text-neutral-400 font-medium">Producto</th>
              <th className="px-4 py-3 text-left text-neutral-400 font-medium">Categoría</th>
              <th className="px-4 py-3 text-center text-neutral-400 font-medium">Tipo</th>
              <th className="px-4 py-3 text-center text-neutral-400 font-medium">Stock actual</th>
              <th className="px-4 py-3 text-center text-neutral-400 font-medium">Stock mínimo</th>
              <th className="px-4 py-3 text-center text-neutral-400 font-medium">Estado</th>
              <th className="px-4 py-3 text-center text-neutral-400 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredProducts.map((product) => {
              const enAlerta = isEnAlerta(product);
              const isEditing = editingId === product.id;

              return (
                <tr
                  key={product.id}
                  className={`transition-colors ${enAlerta ? "bg-red-500/5" : "hover:bg-neutral-900/40"}`}
                >
                  <td className="px-4 py-3">
                    <p className={`font-medium ${enAlerta ? "text-red-300" : "text-neutral-200"}`}>
                      {enAlerta && <span className="mr-1.5 text-red-400">⚠</span>}
                      {product.nombre}
                    </p>
                    <p className="text-neutral-500 text-xs font-mono">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{product.categoria}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium
                        ${product.es_dropshipping
                          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        }`}
                    >
                      {product.es_dropshipping ? "Dropshipping" : "Físico"}
                    </span>
                  </td>

                  {/* Stock actual editable */}
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editValues.stock_actual}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, stock_actual: Number(e.target.value) }))
                        }
                        className="w-20 text-center bg-neutral-800 border border-amber-500/40 rounded-lg px-2 py-1
                          text-neutral-100 text-sm focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className={`font-semibold ${enAlerta ? "text-red-400" : "text-neutral-100"}`}>
                        {product.stock_actual}
                      </span>
                    )}
                  </td>

                  {/* Stock mínimo editable */}
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editValues.stock_minimo}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, stock_minimo: Number(e.target.value) }))
                        }
                        className="w-20 text-center bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1
                          text-neutral-100 text-sm focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className="text-neutral-400">{product.stock_minimo}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {enAlerta ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        Crítico
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        OK
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => saveStock(product.id)}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 text-xs font-semibold
                            hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg bg-neutral-700 text-neutral-300 text-xs font-medium
                            hover:bg-neutral-600 disabled:opacity-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(product)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 text-xs font-medium
                          hover:text-neutral-100 hover:bg-neutral-700 transition-colors"
                      >
                        Editar stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const enAlerta = isEnAlerta(product);
          const isEditing = editingId === product.id;

          return (
            <div
              key={product.id}
              className={`rounded-xl border p-4 ${enAlerta
                ? "border-red-500/30 bg-red-500/5"
                : "border-neutral-800 bg-neutral-900"
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`font-semibold ${enAlerta ? "text-red-300" : "text-neutral-100"}`}>
                    {enAlerta && <span className="mr-1">⚠</span>}
                    {product.nombre}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{product.sku}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium
                      ${product.es_dropshipping
                        ? "bg-violet-500/10 text-violet-400"
                        : "bg-teal-500/10 text-teal-400"
                      }`}
                  >
                    {product.es_dropshipping ? "DS" : "Físico"}
                  </span>
                  {enAlerta ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">Crítico</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">OK</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 text-xs mb-0.5">Stock actual</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      value={editValues.stock_actual}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, stock_actual: Number(e.target.value) }))
                      }
                      className="w-20 bg-neutral-800 border border-amber-500/40 rounded-lg px-2 py-1
                        text-neutral-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <span className={`font-bold ${enAlerta ? "text-red-400" : "text-neutral-100"}`}>
                      {product.stock_actual}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-neutral-500 text-xs mb-0.5">Mínimo</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      value={editValues.stock_minimo}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, stock_minimo: Number(e.target.value) }))
                      }
                      className="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1
                        text-neutral-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <span className="text-neutral-400">{product.stock_minimo}</span>
                  )}
                </div>
                <div className="ml-auto">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveStock(product.id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 text-xs font-semibold
                          hover:bg-amber-400 disabled:opacity-50 transition-colors"
                      >
                        {saving ? "…" : "Guardar"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 rounded-lg bg-neutral-700 text-neutral-300 text-xs transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(product)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 text-xs font-medium
                        hover:text-neutral-100 hover:bg-neutral-700 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}