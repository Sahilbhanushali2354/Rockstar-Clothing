import Link from "next/link";

import type { Product } from "@/app/lib/productModel";
import ProductCard from "./ProductCard";

/*
 * Responsive product grid: 2 cols on phones (in-app browsers),
 * 3 on tablets, 4 on desktop. Handles loading + empty states.
 */
export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  categoryNames,
  empty,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  /** slug → display name, to label each card */
  categoryNames?: Record<string, string>;
  empty?: { title: string; description?: string; action?: { label: string; href: string } };
}) {
  const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6";

  if (loading) {
    return (
      <div className={grid} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border-2 border-line">
            <div className="aspect-[3/4] animate-pulse bg-surface-2" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-2xl font-bold">{empty?.title ?? "Nothing here yet"}</p>
        {empty?.description && <p className="max-w-sm text-sm text-muted">{empty.description}</p>}
        {empty?.action && (
          <Link href={empty.action.href} className="btn-brutal btn-primary btn-sm mt-2">
            {empty.action.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={grid}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryNames?.[product.category]}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
