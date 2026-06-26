// src/app/layout.tsx
// Layout raíz — incluye CartDrawer y CartIcon disponibles globalmente — Fase 4
// MODIFICACIÓN FASE 8 — agrega ChatbotWidget visible en toda la app (RF-24)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/checkout/CartDrawer";
import { CartIcon } from "@/components/ui/CartIcon";
// MODIFICACIÓN FASE 8 — inicio
import { ChatbotWidget } from "@/components/ui/ChatbotWidget";
// MODIFICACIÓN FASE 8 — fin

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Groomer SPA",
    template: "%s | Groomer SPA",
  },
  description: "Barbería & spa para el hombre moderno. Reservas, productos y membresía Elite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-slate-900 antialiased`}>
        {/* Header global con CartIcon */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-slate-900 tracking-tight">
              Groomer<span className="text-indigo-600">SPA</span>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="/catalogo" className="hover:text-indigo-600 transition-colors">
                Catálogo
              </a>
              <a href="/reservar" className="hover:text-indigo-600 transition-colors">
                Reservar
              </a>
              <a href="/dashboard" className="hover:text-indigo-600 transition-colors">
                Mi cuenta
              </a>
            </nav>

            <div className="flex items-center gap-2">
              {/* Ícono de carrito con badge — RF-10 */}
              <CartIcon />
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        {children}

        {/* Drawer del carrito — disponible globalmente — RF-10 */}
        <CartDrawer />

        {/* MODIFICACIÓN FASE 8 — inicio */}
        {/* Widget de chatbot flotante — visible en toda la app — RF-24 */}
        <ChatbotWidget />
        {/* MODIFICACIÓN FASE 8 — fin */}
      </body>
    </html>
  );
}
