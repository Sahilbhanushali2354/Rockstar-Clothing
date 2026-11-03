"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiEyeOff,
  FiLayers,
  FiPackage,
  FiPlus,
  FiX,
} from "react-icons/fi";

import { FStore } from "@/firebase/firebase.config";
import { useAdminUser } from "@/app/components/AdminGuard";
import { PageHeader, Skeleton } from "@/app/components/ui";
import {
  LOW_STOCK,
  PRODUCTS,
  isSoldOut,
  normalizeProduct,
  slugToLabel,
  toSlug,
  type Product,
} from "@/app/lib/products";
import { imageUrl } from "@/app/lib/cloudinary";
import { WHATSAPP_NUMBER } from "@/app/lib/whatsapp";
import { META_PIXEL_ID } from "@/app/lib/metaPixel";
import { CLOUDINARY_CLOUD_NAME } from "@/app/lib/cloudinary";

interface CategorySummary {
  slug: string;
  name: string;
  active: boolean;
}

function StatCard({
  label,
  value,
  href,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  href: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="dc-card group flex flex-col justify-between gap-4 p-4 transition-transform hover:-translate-y-0.5 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{label}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: accent, color: accent === "var(--dc-acid)" ? "var(--dc-ink)" : accent === "var(--dc-text)" ? "var(--dc-bg)" : "var(--dc-text)", border: "2px solid var(--dc-edge)" }}
        >
          <Icon className="text-sm" />
        </span>
      </div>
      <span className="font-display text-3xl font-bold sm:text-4xl">{value}</span>
    </Link>
  );
}

export default function AdminDashboard() {
  const user = useAdminUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(FStore, PRODUCTS),
      (snapshot) => {
        setProducts(
          snapshot.docs
            .map((productDoc) => normalizeProduct(productDoc.id, productDoc.data()))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load products:", error);
        setLoading(false);
      },
    );

    const unsubCategories = onSnapshot(collection(FStore, "categories"), (snapshot) => {
      setCategories(
        snapshot.docs.map((categoryDoc) => {
          const data = categoryDoc.data();
          return {
            slug: toSlug(String(data.slug ?? categoryDoc.id)),
            name: String(data.name ?? categoryDoc.id),
            active: data.active !== false,
          };
        }),
      );
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const stats = useMemo(() => {
    const live = products.filter((product) => product.active);
    return {
      live: live.length,
      hidden: products.length - live.length,
      soldOut: live.filter(isSoldOut).length,
      legacyImages: products.filter((product) =>
        product.images.some((image) => !image.publicId),
      ).length,
    };
  }, [products]);

  // Live products with sizes that are sold out or nearly sold out.
  const attention = useMemo(
    () =>
      products
        .filter((product) => product.active)
        .map((product) => ({
          product,
          sizes: product.sizes.filter((size) => size.stock <= LOW_STOCK),
        }))
        .filter((entry) => entry.sizes.length > 0)
        .slice(0, 6),
    [products],
  );

  const categoryName = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ?? slugToLabel(slug);

  const setup = [
    { done: Boolean(WHATSAPP_NUMBER), label: "WhatsApp number set", hint: "NEXT_PUBLIC_WHATSAPP_NUMBER in .env" },
    { done: Boolean(META_PIXEL_ID), label: "Meta Pixel connected", hint: "NEXT_PUBLIC_META_PIXEL_ID in .env" },
    { done: Boolean(CLOUDINARY_CLOUD_NAME), label: "Cloudinary connected", hint: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env" },
    { done: categories.some((category) => category.active), label: "At least one live category", hint: "Add one in Categories" },
    { done: stats.live > 0, label: "At least one live product", hint: "Add your first drop" },
    { done: products.length > 0 && stats.legacyImages === 0, label: "All images on Cloudinary", hint: `${stats.legacyImages} products still use old images — run the migration` },
  ];
  const setupDone = setup.filter((item) => item.done).length;

  const greeting = user?.email?.split("@")[0];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={greeting ? `Hey ${greeting} 👋` : "Dashboard"}
        description="Here's what's happening in the store."
        actions={
          <Link href="/admin/products/new" className="btn-brutal btn-primary btn-sm">
            <FiPlus /> Add product
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="Live" value={stats.live} href="/admin/products?status=live" accent="var(--dc-acid)" icon={FiPackage} />
            <StatCard label="Hidden" value={stats.hidden} href="/admin/products?status=hidden" accent="var(--dc-surface-2)" icon={FiEyeOff} />
            <StatCard label="Sold out" value={stats.soldOut} href="/admin/products?status=soldout" accent="var(--dc-text)" icon={FiAlertTriangle} />
            <StatCard label="Categories" value={categories.length} href="/admin/categories" accent="var(--dc-acid)" icon={FiLayers} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Needs attention */}
          <section className="dc-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Stock alerts</h2>
              <Link href="/admin/products?status=low" className="text-xs font-bold text-muted hover:underline">
                View all
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-24" />
            ) : attention.length === 0 ? (
              <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted">
                All live products have healthy stock. 🎉
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--dc-line)" }}>
                {attention.map(({ product, sizes }) => (
                  <li key={product.id} className="border-line py-3 first:pt-0 last:pb-0">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-surface-2">
                        {product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl(product.images[0], 100, "4:5")} alt="" className="h-full w-full object-contain" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{product.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sizes.map((size) => (
                            <span
                              key={size.label}
                              className={`dc-badge ${size.stock === 0 ? "dc-badge-ink" : "dc-badge-outline"}`}
                            >
                              {size.label}: {size.stock === 0 ? "out" : size.stock}
                            </span>
                          ))}
                        </div>
                      </div>
                      <FiArrowRight className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent */}
          <section className="dc-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Latest drops</h2>
              <Link href="/admin/products" className="text-xs font-bold text-muted hover:underline">
                All products
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40" />
            ) : products.length === 0 ? (
              <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted">
                No products yet.{" "}
                <Link href="/admin/products/new" className="font-bold underline">
                  Add your first one
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {products.slice(0, 5).map((product) => (
                  <Link key={product.id} href={`/admin/products/${product.id}`} className="group min-w-0">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-surface-2">
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl(product.images[0], 240, "3:4")}
                          alt=""
                          className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs font-bold">{product.title}</p>
                    <p className="truncate text-[11px] text-muted">{categoryName(product.category)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Setup checklist */}
        <aside className="dc-card h-fit p-4 sm:p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Store setup</h2>
            <span className={`dc-badge ${setupDone === setup.length ? "dc-badge-live" : "dc-badge-muted"}`}>
              {setupDone}/{setup.length}
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${(setupDone / setup.length) * 100}%`, background: "var(--dc-acid)" }}
            />
          </div>
          <ul className="space-y-3">
            {setup.map((item) => (
              <li key={item.label} className="flex gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                  style={{
                    background: item.done ? "var(--dc-acid)" : "var(--dc-surface-2)",
                    color: "var(--dc-ink)",
                    border: "1.5px solid var(--dc-edge)",
                  }}
                  aria-hidden
                >
                  {item.done ? <FiCheck className="text-xs" /> : <FiX className="text-xs opacity-40" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${item.done ? "text-muted line-through" : ""}`}>{item.label}</p>
                  {!item.done && <p className="text-xs text-muted">{item.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
