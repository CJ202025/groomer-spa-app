// src/app/(shop)/producto/[sku]/page.tsx
// Detalle de producto — RF-09

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./ProductDetailClient";
import type { Metadata } from "next";
import type { Product } from "@/types/database";

interface PageProps {
  params: Promise<{ sku: string }>;
}

// Metadata dinámica para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sku } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("sku", sku)
    .single();

  if (!data) return { title: "Producto | Groomer SPA" };

  const { nombre, descripcion } = data as Product;
  return {
    title: `${nombre} | Groomer SPA`,
    description: descripcion,
  };
}

export default async function ProductoPage({ params }: PageProps) {
  const { sku } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("sku", sku)
    .single();

  if (error || !product) notFound();

  return <ProductDetailClient product={product!} />;
}