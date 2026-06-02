import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // INICIO MODIFICACIÓN: Silencia el warning de workspace root de Turbopack //
  turbopack: {
    root: __dirname,
  },
  // FIN MODIFICACIÓN //
};

export default nextConfig;
