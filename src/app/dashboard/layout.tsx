// src/app/dashboard/layout.tsx
// Layout del dashboard: barra inferior en mobile, lateral en desktop
// Navegación condicional según rol del usuario

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database";

// Íconos SVG inline (sin dependencias)
const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={22}
    height={22}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
  </svg>
);
const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={22}
    height={22}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={22}
    height={22}
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const ScissorsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={22}
    height={22}
    aria-hidden="true"
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);
// MODIFICACIÓN FASE 5 — inicio
const ShoppingBagIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={22}
    height={22}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
  </svg>
);
// MODIFICACIÓN FASE 5 — fin

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Rol[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: <HomeIcon />,
    roles: ["cliente", "barbero", "admin"],
  },
  {
    href: "/reservar",
    label: "Reservar",
    icon: <CalendarIcon />,
    roles: ["cliente"],
  },
  {
    href: "/dashboard/citas",
    label: "Mis citas",
    icon: <CalendarIcon />,
    roles: ["cliente"],
  },
  {
    href: "/dashboard/gestion-citas",
    label: "Citas",
    icon: <ScissorsIcon />,
    roles: ["barbero"],
  },
  // MODIFICACIÓN FASE 3 — inicio
  {
    href: "/dashboard/gestion-citas",
    label: "Gestión citas",
    icon: <ScissorsIcon />,
    roles: ["admin"],
  },
  // MODIFICACIÓN FASE 3 — fin
  // MODIFICACIÓN FASE 5 — inicio
  {
    href: "/dashboard/pedidos",
    label: "Mis pedidos",
    icon: <ShoppingBagIcon />,
    roles: ["cliente"],
  },
  // MODIFICACIÓN FASE 5 — fin
  {
    href: "/dashboard/perfil",
    label: "Perfil",
    icon: <UserIcon />,
    roles: ["cliente", "barbero", "admin"],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await (supabase as any)
    .from("users")
    .select("rol, nombre_completo")
    .eq("id", user.id)
    .single();

  const rol: Rol = profile?.rol ?? "cliente";
  const nombre = profile?.nombre_completo ?? user.email ?? "Usuario";

  // Filtrar ítems visibles según rol
  const visibleNav = navItems.filter((item) => item.roles.includes(rol));

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-stone-200 md:bg-white md:py-6">
        {/* Marca */}
        <div className="px-6 pb-6 border-b border-stone-100">
          <span className="text-xl font-bold text-stone-900">
            Groomer <span className="text-amber-500">SPA</span>
          </span>
        </div>

        {/* Info usuario */}
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-stone-800 truncate">
            {nombre}
          </p>
          <p className="text-xs text-stone-400 capitalize mt-0.5">{rol}</p>
        </div>

        {/* Navegación */}
        <nav aria-label="Navegación principal" className="flex-1 px-3">
          <ul className="space-y-1">
            {visibleNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-amber-50 hover:text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="px-3 pt-4 border-t border-stone-100 mt-4">
          <form action="/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                width={20}
                height={20}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 pb-24 md:pb-6">{children}</main>

      {/* Barra de navegación inferior (mobile) */}
      <nav
        aria-label="Navegación móvil"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white md:hidden"
      >
        <ul className="flex items-center justify-around px-2 py-2">
          {visibleNav.slice(0, 5).map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 py-1 text-stone-500 hover:text-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
