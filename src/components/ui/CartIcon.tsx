// src/components/ui/CartIcon.tsx
// Ícono del carrito con badge — RF-10

"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export function CartIcon() {
  const { toggleCart, totalItems } = useCartStore();
  const count = totalItems();

  return (
    <button
      onClick={toggleCart}
      aria-label={`Abrir carrito${count > 0 ? `, ${count} producto${count !== 1 ? "s" : ""}` : ""}`}
      className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <ShoppingCart className="w-5 h-5" />

      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full px-1 leading-none"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}