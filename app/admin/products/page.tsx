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
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutlined,
  EditOutlined,
  Search,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

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
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    {},
  );
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
            .map((productDoc) =>
              normalizeProduct(productDoc.id, productDoc.data()),
            )
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

    const unsubCategories = onSnapshot(
      collection(FStore, "categories"),
      (snapshot) => {
        const names: Record<string, string> = {};
        snapshot.docs.forEach((categoryDoc) => {
          const data = categoryDoc.data();
          names[toSlug(String(data.slug ?? categoryDoc.id))] = String(
            data.name ?? categoryDoc.id,
          );
        });
        setCategoryNames(names);
      },
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  };

  const categoriesInUse = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) =>
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1),
    );
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
      if (
        status === "soldout" &&
        !(product.sizes.length > 0 && totalStock(product) === 0)
      )
        return false;
      if (status === "low" && !hasLowStock(product)) return false;
      if (
        term &&
        !`${product.title} ${product.subcategory}`.toLowerCase().includes(term)
      )
        return false;
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
      toast.success(
        product.active
          ? `"${product.title}" hidden`
          : `"${product.title}" is live`,
      );
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

  const addButton = (
    <Button
      component={Link}
      href="/admin/products/new"
      variant="contained"
      startIcon={<Add />}
    >
      Add product
    </Button>
  );

  const badge = {
    height: 22,
    borderRadius: 1,
    border: "1.5px solid",
    fontSize: 11,
  } as const;
  const mutedBadge = {
    ...badge,
    borderColor: "var(--dc-line)",
    color: "text.secondary",
    bgcolor: "transparent",
  } as const;

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title={category ? label(category) : "Products"}
        description={
          loading
            ? "Loading…"
            : `${filtered.length} of ${products.length} products`
        }
        actions={addButton}
      />

      {/* Filters */}
      <Stack spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products…"
          fullWidth
          slotProps={{
            htmlInput: { "aria-label": "Search products" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            pb: 0.5,
            overflowX: "auto",
            flexWrap: { xs: "nowrap", sm: "wrap" },
            alignItems: "center",
          }}
        >
          <TextField
            select
            size="small"
            value={category}
            onChange={(event) => setParam("category", event.target.value)}
            sx={{ flexShrink: 0, minWidth: 180 }}
            slotProps={{
              select: { displayEmpty: true },
              htmlInput: { "aria-label": "Filter by category" },
            }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categoriesInUse.map(([slug, count]) => (
              <MenuItem key={slug} value={slug}>
                {label(slug)} ({count})
              </MenuItem>
            ))}
          </TextField>

          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.key;
            return (
              <Chip
                key={filter.key}
                label={filter.label}
                clickable
                onClick={() => setParam("status", filter.key)}
                aria-pressed={active}
                sx={{
                  flexShrink: 0,
                  height: 38,
                  px: 0.5,
                  borderRadius: 2,
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "none",
                  letterSpacing: 0,
                  border: "1.5px solid",
                  ...(active
                    ? {
                        bgcolor: "var(--dc-text)",
                        color: "var(--dc-bg)",
                        borderColor: "var(--dc-text)",
                        "&:hover": { bgcolor: "var(--dc-text)" },
                      }
                    : {
                        bgcolor: "var(--dc-surface)",
                        borderColor: "var(--dc-line)",
                        "&:hover": {
                          bgcolor: "var(--dc-surface)",
                          borderColor: "var(--dc-edge)",
                        },
                      }),
                }}
              />
            );
          })}
        </Stack>
      </Stack>

      {loading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </Stack>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first drop — it goes live in the store as soon as you save."
          action={addButton}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try a different search or filter."
        />
      ) : (
        <Stack
          component="ul"
          spacing={1.5}
          sx={{ m: 0, p: 0, listStyle: "none" }}
        >
          {filtered.map((product) => {
            const stock = totalStock(product);
            const soldOut = product.sizes.length > 0 && stock === 0;
            const busy = busyId === product.id;

            return (
              <Card
                component="li"
                key={product.id}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { sm: "center" },
                  gap: 1.5,
                  p: 1.5,
                }}
              >
                <MuiLink
                  component={Link}
                  href={`/admin/products/${product.id}`}
                  color="inherit"
                  underline="none"
                  sx={{
                    display: "flex",
                    minWidth: 0,
                    flex: 1,
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 80,
                      flexShrink: 0,
                      overflow: "hidden",
                      borderRadius: 2,
                      bgcolor: "var(--dc-surface-2)",
                    }}
                  >
                    {product.images[0] && (
                      <Box
                        component="img"
                        src={imageUrl(product.images[0], 160, "4:5")}
                        alt=""
                        loading="lazy"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>
                      {product.title || "Untitled"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{product.price.toLocaleString("en-IN")} ·{" "}
                      {label(product.category)}
                      {product.subcategory && ` · ${product.subcategory}`}
                    </Typography>
                    <Stack
                      direction="row"
                      useFlexGap
                      spacing={0.75}
                      sx={{ mt: 0.75, flexWrap: "wrap" }}
                    >
                      {product.active ? (
                        <Chip
                          size="small"
                          label="Live"
                          color="primary"
                          sx={{ ...badge, borderColor: "var(--dc-ink)" }}
                        />
                      ) : (
                        <Chip size="small" label="Hidden" sx={mutedBadge} />
                      )}
                      {soldOut ? (
                        <Chip
                          size="small"
                          label="Sold out"
                          color="secondary"
                          sx={badge}
                        />
                      ) : product.sizes.length > 0 ? (
                        <Chip
                          size="small"
                          label={`${stock} in stock`}
                          sx={
                            hasLowStock(product)
                              ? {
                                  ...badge,
                                  borderColor: "var(--dc-edge)",
                                  bgcolor: "transparent",
                                }
                              : mutedBadge
                          }
                        />
                      ) : null}
                      {product.featured && (
                        <Chip
                          size="small"
                          label="Featured"
                          color="secondary"
                          sx={badge}
                        />
                      )}
                      {product.images.some((image) => !image.publicId) && (
                        <Tooltip title="Image still on Firebase Storage">
                          <Chip
                            size="small"
                            label="Legacy img"
                            sx={mutedBadge}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </MuiLink>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    flexShrink: 0,
                    borderTop: { xs: "1px solid var(--dc-line)", sm: 0 },
                    pt: { xs: 1.5, sm: 0 },
                  }}
                >
                  <Button
                    component={Link}
                    href={`/admin/products/${product.id}`}
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined />}
                    sx={{ flex: { xs: 1, sm: "none" } }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={busy}
                    onClick={() => toggleActive(product)}
                    aria-label={
                      product.active
                        ? `Hide ${product.title}`
                        : `Show ${product.title}`
                    }
                    startIcon={
                      product.active ? (
                        <VisibilityOffOutlined />
                      ) : (
                        <VisibilityOutlined />
                      )
                    }
                    sx={{ flex: { xs: 1, sm: "none" } }}
                  >
                    {product.active ? "Hide" : "Show"}
                  </Button>
                  {confirmId === product.id ? (
                    <>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={busy}
                        onClick={() => handleDelete(product)}
                        sx={{ flex: { xs: 1, sm: "none" }, color: "#fff" }}
                      >
                        {busy ? "Deleting…" : "Confirm"}
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <IconButton
                      onClick={() => setConfirmId(product.id)}
                      aria-label={`Delete ${product.title}`}
                      sx={{
                        color: "error.main",
                        border: "1.5px solid var(--dc-line)",
                        "&:hover": { borderColor: "error.main" },
                      }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
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
