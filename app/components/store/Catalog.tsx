"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import StoreShell, { Container } from "./StoreShell";
import SectionHeader from "./SectionHeader";
import ProductGrid from "./ProductGrid";
import { useCategories } from "@/app/lib/useCategories";
import {
  getActiveProducts,
  isSoldOut,
  slugToLabel,
  toSlug,
  type Product,
  type StoreCategory,
} from "@/app/lib/products";

type Sort = "new" | "price-asc" | "price-desc";

const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

/*
 * Shared catalog page for /shop (all products) and /category/[slug].
 * Category chips, sort, "hide sold out", product grid.
 *
 * `initialProducts` comes from the server (instant paint + SEO); the
 * client then refreshes silently for live stock. `null` = the server
 * couldn't load them, so the client fetches with a loading state.
 */
export default function Catalog({
  categorySlug,
  initialProducts = null,
  initialCategories = [],
}: {
  categorySlug?: string;
  initialProducts?: Product[] | null;
  initialCategories?: StoreCategory[];
}) {
  const slug = categorySlug ? toSlug(categorySlug) : "";
  const live = useCategories();
  // Use live categories once loaded; server-provided ones until then.
  const categories = live.loading ? initialCategories : live.categories;

  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(initialProducts === null);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<Sort>("new");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);

    getActiveProducts(slug || undefined)
      .then((list) => active && setProducts(list))
      .catch((fetchError) => {
        console.error("Failed to load products:", fetchError);
        // Keep showing server data if we have it.
        if (active && initialProducts === null) setError(true);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const category = categories.find((item) => item.slug === slug);
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.slug, item.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const list = inStockOnly ? products.filter((product) => !isSoldOut(product)) : [...products];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    // "new" is already newest-first from getActiveProducts
    return list;
  }, [products, sort, inStockOnly]);

  const title = slug ? category?.name ?? slugToLabel(slug) : "Shop";
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
      active ? "border-ink bg-acid text-ink" : "border-line hover:border-edge"
    }`;

  return (
    <StoreShell container={false}>
      {/* Header band */}
      <section className="border-b-2 border-edge bg-surface">
        <Container className="pb-6 pt-10 sm:pt-14">
          <SectionHeader
            as="h1"
            eyebrow={slug ? "Collection" : "All products"}
            title={slug ? title : "Shop the"}
            highlight={slug ? undefined : "drop"}
            description={
              slug
                ? category?.subtitle || "Fresh fits, limited stock."
                : "Every piece, every collection. Limited stock — when it's gone, it's gone."
            }
          />

          {/* Category chips */}
          {categories.length > 0 && (
            <nav aria-label="Collections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <Link href="/shop" className={chip(!slug)} aria-current={!slug ? "page" : undefined}>
                All
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.id}
                  href={`/category/${item.slug}`}
                  className={chip(item.slug === slug)}
                  aria-current={item.slug === slug ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      <Container className="py-6 sm:py-10">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted" aria-live="polite">
            {loading ? "Loading…" : `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
                className="h-4 w-4 accent-[var(--dc-ink)]"
              />
              In stock
            </label>
            <div className="flex rounded-full border-2 border-edge p-0.5" role="group" aria-label="Sort">
              {SORTS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSort(option.key)}
                  aria-pressed={sort === option.key}
                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                    sort === option.key ? "bg-fg text-bg" : "text-muted hover:text-fg"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold">Couldn&apos;t load products</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-brutal btn-primary btn-sm">
              Try again
            </button>
          </div>
        ) : (
          <ProductGrid
            products={visible}
            loading={loading}
            categoryNames={slug ? undefined : categoryNames}
            empty={
              inStockOnly && products.length > 0
                ? { title: "All sold out", description: "Everything here is sold out right now. Restocks drop on Instagram first." }
                : { title: "Dropping soon", description: "Nothing here yet — check back soon.", action: { label: "Shop all", href: "/shop" } }
            }
          />
        )}
      </Container>
    </StoreShell>
  );
}
