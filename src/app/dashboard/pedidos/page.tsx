// src/app/dashboard/pedidos/page.tsx
// Historial de pedidos del usuario autenticado — RF-02, RF-15

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EstadoPedido, MetodoEnvio } from "@/types/database";
import { Package, Download, ShoppingBag, ArrowRight } from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Pedido {
  id: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  metodo_envio: MetodoEnvio;
  estado_pedido: EstadoPedido;
  token_pago: string | null;
  boleta_url: string | null;
  created_at?: string; // opcional: Supabase lo agrega automáticamente si la tabla fue creada con él
}

// ── Helpers visuales ──────────────────────────────────────────────────────────

const BADGE_ESTADO: Record<EstadoPedido, { label: string; clase: string }> = {
  confirmado: {
    label: "Confirmado",
    clase: "bg-blue-100 text-blue-700 border-blue-200",
  },
  en_preparacion: {
    label: "En preparación",
    clase: "bg-amber-100 text-amber-700 border-amber-200",
  },
  completado: {
    label: "Completado",
    clase: "bg-green-100 text-green-700 border-green-200",
  },
};

const LABEL_ENVIO: Record<MetodoEnvio, string> = {
  Recojo: "Recojo en tienda",
  Delivery_Local: "Delivery local",
  Nacional: "Envío nacional",
};

// ── Componente de tarjeta de pedido ──────────────────────────────────────────

function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const badge = BADGE_ESTADO[pedido.estado_pedido];
  const numeroCorto = pedido.id.substring(0, 8).toUpperCase();

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Package className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 font-mono">
              #{numeroCorto}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {pedido.created_at ? formatDate(pedido.created_at) : `ID: ${pedido.id.substring(0, 8).toUpperCase()}`}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.clase}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Modalidad</span>
          <span className="font-medium text-slate-700">
            {LABEL_ENVIO[pedido.metodo_envio]}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium text-slate-700">
            {formatCurrency(pedido.subtotal)}
          </span>
        </div>
        {pedido.costo_envio > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Envío</span>
            <span className="font-medium text-slate-700">
              {formatCurrency(pedido.costo_envio)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-2 border-t border-slate-50">
          <span className="text-slate-900 text-sm">Total pagado</span>
          <span className="text-indigo-600">{formatCurrency(pedido.total)}</span>
        </div>
      </div>

      {/* Pie — acciones */}
      <div className="px-5 pb-4 flex items-center gap-3">
        {pedido.boleta_url ? (
          <a
            href={pedido.boleta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Boleta PDF
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">
            Boleta pendiente de generación…
          </span>
        )}
      </div>
    </article>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function PedidosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener pedidos del usuario ordenados por ID descendente
  // Nota: se ordena por "id" para evitar dependencia de la columna created_at
  //        (añadida automáticamente por Supabase pero no siempre presente en tablas creadas via SQL).
  const { data: pedidos, error } = await (supabase as any)
    .from("orders")
    .select("*")
    .eq("usuario_id", user!.id)
    .order("id", { ascending: false });

  if (error) {
    // El error {} vacío suele indicar un problema de RLS en Supabase.
    // Asegúrate de haber creado la política RLS:
    //   CREATE POLICY "users_own_orders" ON orders FOR SELECT
    //   USING (auth.uid() = usuario_id);
    console.error("[pedidos] Error obteniendo pedidos (¿RLS bloqueando?):", JSON.stringify(error));
  }

  const listaPedidos: Pedido[] = pedidos ?? [];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mis pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Historial de compras y comprobantes de pago
        </p>
      </div>

      {/* Lista de pedidos */}
      {listaPedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              Aún no tienes pedidos
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Explora el catálogo y realiza tu primera compra
            </p>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Ver catálogo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listaPedidos.map((pedido) => (
            <TarjetaPedido key={pedido.id} pedido={pedido} />
          ))}
        </div>
      )}
    </div>
  );
}
