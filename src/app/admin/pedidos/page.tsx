"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, MetodoEnvio, EstadoPedido } from "@/types/database";

interface OrderWithUser extends Order {
  users?: { nombre_completo: string; email: string } | null;
}

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  completado: "Completado",
};

const ESTADO_COLORS: Record<EstadoPedido, string> = {
  confirmado: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  en_preparacion: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  completado: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const METODO_LABELS: Record<MetodoEnvio, string> = {
  Recojo: "Recojo en tienda",
  Delivery_Local: "Delivery local",
  Nacional: "Envío nacional",
};

const NEXT_ESTADO: Record<EstadoPedido, EstadoPedido | null> = {
  confirmado: "en_preparacion",
  en_preparacion: "completado",
  completado: null,
};

const FILTER_OPTIONS: Array<{ value: EstadoPedido | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "confirmado", label: "Confirmados" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "completado", label: "Completados" },
];

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EstadoPedido | "todos">("todos");
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const query = supabase
      .from("orders")
      .select("*, users:usuario_id(nombre_completo, email)")
      .order("id", { ascending: false });

    const { data, error } = filter === "todos"
      ? await query
      : await query.eq("estado_pedido", filter);

    if (error) {
      setError("No se pudieron cargar los pedidos.");
    } else {
      setOrders((data as OrderWithUser[]) ?? []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const advanceEstado = async (order: OrderWithUser) => {
    const next = NEXT_ESTADO[order.estado_pedido];
    if (!next) return;

    setUpdating(order.id);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_pedido: next }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al actualizar el pedido.");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, estado_pedido: next } : o))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Gestión de Pedidos</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Administra el ciclo de vida de todas las órdenes del sistema.
        </p>
      </div>

      {/* Error global */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === opt.value
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          No hay pedidos con este filtro.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">ID Pedido</th>
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left text-neutral-400 font-medium">Método</th>
                  <th className="px-4 py-3 text-right text-neutral-400 font-medium">Total</th>
                  <th className="px-4 py-3 text-center text-neutral-400 font-medium">Estado</th>
                  <th className="px-4 py-3 text-center text-neutral-400 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredOrders.map((order) => {
                  const next = NEXT_ESTADO[order.estado_pedido];
                  return (
                    <tr key={order.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-neutral-400 text-xs">
                        {order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-200 font-medium">
                          {order.users?.nombre_completo ?? "—"}
                        </p>
                        <p className="text-neutral-500 text-xs">{order.users?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {METODO_LABELS[order.metodo_envio]}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-100">
                        S/ {order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${ESTADO_COLORS[order.estado_pedido]}`}>
                          {ESTADO_LABELS[order.estado_pedido]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {next ? (
                          <button
                            onClick={() => advanceEstado(order)}
                            disabled={updating === order.id}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium
                              hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                              border border-amber-500/20"
                          >
                            {updating === order.id ? "Actualizando…" : `→ ${ESTADO_LABELS[next]}`}
                          </button>
                        ) : (
                          <span className="text-neutral-600 text-xs">Finalizado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const next = NEXT_ESTADO[order.estado_pedido];
              return (
                <div key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-neutral-500 mb-0.5">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-semibold text-neutral-100">
                        {order.users?.nombre_completo ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-500">{METODO_LABELS[order.metodo_envio]}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${ESTADO_COLORS[order.estado_pedido]}`}>
                      {ESTADO_LABELS[order.estado_pedido]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-100">S/ {order.total.toFixed(2)}</span>
                    {next ? (
                      <button
                        onClick={() => advanceEstado(order)}
                        disabled={updating === order.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium
                          hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                          border border-amber-500/20"
                      >
                        {updating === order.id ? "Actualizando…" : `→ ${ESTADO_LABELS[next]}`}
                      </button>
                    ) : (
                      <span className="text-neutral-600 text-xs">Finalizado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}