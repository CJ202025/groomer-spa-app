// src/lib/cart-store.ts
// Estado global del carrito — Fase 4
// MODIFICACIÓN FASE 6 — inicio: se agrega campo esMiembroElite y acción setEsMiembroElite
// El selector subtotal() aplica 15% de descuento si esMiembroElite = true (RF-20)

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

    // MODIFICACIÓN FASE 6 — inicio
    esMiembroElite: boolean;
    setEsMiembroElite: (valor: boolean) => void;
    // MODIFICACIÓN FASE 6 — fin

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
    subtotalSinDescuento: () => number;
    subtotal: () => number;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            // MODIFICACIÓN FASE 6 — inicio
            esMiembroElite: false,
            setEsMiembroElite: (valor: boolean) => set({ esMiembroElite: valor }),
            // MODIFICACIÓN FASE 6 — fin

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

            // MODIFICACIÓN FASE 6 — inicio
            // Subtotal bruto sin ningún descuento (útil para mostrar precio original)
            subtotalSinDescuento: () =>
                get().items.reduce(
                    (sum, i) => sum + i.product.precio * i.cantidad,
                    0
                ),

            // Subtotal con descuento Elite del 15% si aplica (RF-20)
            subtotal: () => {
                const base = get().items.reduce(
                    (sum, i) => sum + i.product.precio * i.cantidad,
                    0
                );
                if (get().esMiembroElite) {
                    return base * 0.85; // 15% de descuento automático
                }
                return base;
            },
            // MODIFICACIÓN FASE 6 — fin
        }),
        {
            name: "groomer-cart",
            // Solo persistir items y estado Elite, no el drawer
            partialize: (state) => ({
                items: state.items,
                esMiembroElite: state.esMiembroElite,
            }),
        }
    )
);