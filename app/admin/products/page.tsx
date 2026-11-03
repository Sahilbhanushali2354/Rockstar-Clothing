"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";

import { FStore } from "@/firebase/firebase.config";
import { EmptyState, PageHeader, Skeleton } from "@/app/components/ui";
import {
  PRODUCTS,
  hasLowStock,
  normalizeProduct,
  slugToLabel,
  toSlug,
  totalStock,
  type Product,
} from "@/app/lib/products";
import { deleteFromCloudinary, imageUrl } from "@/app/lib/cloudinary";
import { revalidateStore } from "@/app/lib/adminApi";

type StatusFilter = "all" | "live" | "hidden" | "soldout" | "low";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "hidden", label: "Hidden" },
  { key: "low", label: "Low stock" },
  { key: "soldout", label: "Sold out" },
];

function ProductsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = toSlug(searchParams.get("category") ?? "");
  const status = (searchParams.get("status") as StatusFilter) || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
        console.error(error);
        toast.error("Couldn't load products. Check Firestore rules.");
        setLoading(false);
      },
    );

    const unsubCategories = onSnapshot(collection(FStore, "categories"), (snapshot) => {
      const names: Record<string, string> = {};
      snapshot.docs.forEach((categoryDoc) => {
        const data = categoryDoc.data();
        names[toSlug(String(data.slug ?? categoryDoc.id))] = String(data.name ?? categoryDoc.id);
      });
      setCategoryNames(names);
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const categoriesInUse = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => counts.set(product.category, (counts.get(product.category) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) =>
      (categoryNames[a[0]] ?? a[0]).localeCompare(categoryNames[b[0]] ?? b[0]),
    );
  }, [products, categoryNames]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (status === "live" && !product.active) return false;
      if (status === "hidden" && product.active) return false;
      if (status === "soldout" && !(product.sizes.length > 0 && totalStock(product) === 0)) return false;
      if (status === "low" && !hasLowStock(product)) return false;
      if (term && !`${product.title} ${product.subcategory}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, category, status, search]);

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    try {
      await updateDoc(doc(FStore, PRODUCTS, product.id), {
        active: !product.active,
        updatedAt: serverTimestamp(),
      });
      toast.success(product.active ? `"${product.title}" hidden` : `"${product.title}" is live`);
      void revalidateStore({ products: true, productIds: [product.id] });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't update product.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    setBusyId(product.id);
    try {
      await deleteDoc(doc(FStore, PRODUCTS, product.id));
      await deleteFromCloudinary(product.images.map((image) => image.publicId));
      toast.success(`"${product.title}" deleted`);
      void revalidateStore({ products: true, productIds: [product.id] });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete product.");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const label = (slug: string) => categoryNames[slug] ?? slugToLabel(slug);

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title={category ? label(category) : "Products"}
        description={
          loading ? "Loading…" : `${filtered.length} of ${products.length} products`
        }
        actions={
          <Link href="/admin/products/new" className="btn-brutal btn-primary btn-sm">
            <FiPlus /> Add product
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="dc-input pl-10"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <select
            value={category}
            onChange={(event) => setParam("category", event.target.value)}
            aria-label="Filter by category"
            className="dc-input w-auto shrink-0 pr-8"
            style={{ minHeight: 38 }}
          >
            <option value="">All categories</option>
            {categoriesInUse.map(([slug, count]) => (
              <option key={slug} value={slug}>
                {label(slug)} ({count})
              </option>
            ))}
          </select>

          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setParam("status", filter.key)}
                aria-pressed={active}
                className="btn shrink-0"
                style={
                  active
                    ? { background: "var(--dc-text)", color: "var(--dc-bg)", borderColor: "var(--dc-text)", minHeight: 38 }
                    : { minHeight: 38 }
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first drop — it goes live in the store as soon as you save."
          action={
            <Link href="/admin/products/new" className="btn-brutal btn-primary btn-sm">
              <FiPlus /> Add product
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing matches" description="Try a different search or filter." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((product) => {
            const stock = totalStock(product);
            const soldOut = product.sizes.length > 0 && stock === 0;
            const busy = busyId === product.id;

            return (
              <li key={product.id} className="dc-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <Link href={`/admin/products/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl(product.images[0], 160, "4:5")}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{product.title || "Untitled"}</p>
                    <p className="text-sm text-muted">
                      ₹{product.price.toLocaleString("en-IN")} · {label(product.category)}
                      {product.subcategory && ` · ${product.subcategory}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`dc-badge ${product.active ? "dc-badge-live" : "dc-badge-muted"}`}>
                        {product.active ? "Live" : "Hidden"}
                      </span>
                      {soldOut ? (
                        <span className="dc-badge dc-badge-ink">Sold out</span>
                      ) : product.sizes.length > 0 ? (
                        <span className={`dc-badge ${hasLowStock(product) ? "dc-badge-outline" : "dc-badge-muted"}`}>
                          {stock} in stock
                        </span>
                      ) : null}
                      {product.featured && <span className="dc-badge dc-badge-ink">Featured</span>}
                      {product.images.some((image) => !image.publicId) && (
                        <span className="dc-badge dc-badge-muted" title="Image still on Firebase Storage">
                          Legacy img
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 gap-2 border-t border-line pt-3 sm:border-0 sm:pt-0">
                  <Link href={`/admin/products/${product.id}`} className="btn flex-1 sm:flex-none">
                    <FiEdit2 /> Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleActive(product)}
                    className="btn flex-1 sm:flex-none"
                    aria-label={product.active ? `Hide ${product.title}` : `Show ${product.title}`}
                  >
                    {product.active ? <FiEyeOff /> : <FiEye />}
                    {product.active ? "Hide" : "Show"}
                  </button>
                  {confirmId === product.id ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(product)}
                        className="btn flex-1 sm:flex-none"
                        style={{ background: "var(--dc-danger)", color: "#fff", borderColor: "var(--dc-danger)" }}
                      >
                        {busy ? "Deleting…" : "Confirm"}
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="btn btn-ghost">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(product.id)}
                      className="btn btn-danger-soft"
                      aria-label={`Delete ${product.title}`}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <ProductsList />
    </Suspense>
  );
}
