// src/lib/cart-store.ts
// Estado global del carrito — Fase 4

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/database";

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface CartItem {
    product: Product;
    cantidad: number;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;

    // Acciones
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, cantidad: number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;

    // Selectores derivados
    totalItems: () => number;
    subtotal: () => number;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            // ── Acciones ─────────────────────────────────────────────────────────────

            addItem: (product: Product) => {
                const { items } = get();
                const existing = items.find((i) => i.product.id === product.id);

                if (existing) {
                    set({
                        items: items.map((i) =>
                            i.product.id === product.id
                                ? { ...i, cantidad: i.cantidad + 1 }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...items, { product, cantidad: 1 }] });
                }

                // Abrir el drawer al agregar
                set({ isOpen: true });
            },

            removeItem: (productId: string) => {
                set({ items: get().items.filter((i) => i.product.id !== productId) });
            },

            updateQuantity: (productId: string, cantidad: number) => {
                if (cantidad <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((i) =>
                        i.product.id === productId ? { ...i, cantidad } : i
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set({ isOpen: !get().isOpen }),

            // ── Selectores ────────────────────────────────────────────────────────────

            totalItems: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),

            subtotal: () =>
                get().items.reduce(
                    (sum, i) => sum + i.product.precio * i.cantidad,
                    0
                ),
        }),
        {
            name: "groomer-cart",
            // Solo persistir items, no el estado del drawer
            partialize: (state) => ({ items: state.items }),
        }
    )
);