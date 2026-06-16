// src/components/catalog/ProductCard.tsx
// Tarjeta de producto — RF-09

"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // evitar navegar si la card es un link
    addItem(product);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
      {/* Imagen */}
      <Link href={`/producto/${product.sku}`} className="block relative aspect-square bg-slate-50">
        {/* Placeholder visual mientras no hay imagen real */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <Package className="w-12 h-12 text-slate-300" />
        </div>
        {/* Cuando haya imágenes reales, descomentar:
        <Image
          src={product.imagen_url ?? "/placeholder-product.jpg"}
          alt={product.nombre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        */}

        {/* Badge dropshipping (solo visible internamente, oculto para clientes) */}
        {product.es_dropshipping && (
          <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full hidden">
            Dropshipping
          </span>
        )}
      </Link>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Categoría */}
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
          {product.categoria}
        </span>

        {/* Nombre */}
        <Link href={`/producto/${product.sku}`}>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 hover:text-indigo-700 transition-colors">
            {product.nombre}
          </h3>
        </Link>

        {/* Descripción corta */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.descripcion}
        </p>

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <span className="text-base font-bold text-slate-900">
            {formatCurrency(product.precio)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={product.stock_actual === 0}
            aria-label={`Agregar ${product.nombre} al carrito`}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden />
            {product.stock_actual === 0 ? "Agotado" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}