"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  AddPhotoAlternateOutlined,
  ArrowBack,
  ChevronLeft,
  ChevronRight,
  Close,
  DeleteOutlined,
  OpenInNew,
  Remove,
} from "@mui/icons-material";

import { FStore } from "@/firebase/firebase.config";
import { PageHeader } from "@/app/components/ui";
import {
  DEFAULT_SIZE_LABELS,
  LOW_STOCK,
  PRODUCTS,
  subscribeProductForAdmin,
  toSlug,
  type Product,
  type ProductImage,
  type ProductSize,
} from "@/app/lib/products";
import {
  deleteFromCloudinary,
  imageUrl,
  uploadToCloudinary,
} from "@/app/lib/cloudinary";
import { revalidateStore } from "@/app/lib/adminApi";

interface CategoryOption {
  slug: string;
  name: string;
}

interface FormState {
  title: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  subcategory: string;
  active: boolean;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "",
  subcategory: "",
  active: true,
  featured: false,
};

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "S–XL", sizes: DEFAULT_SIZE_LABELS },
  { label: "XS–XXL", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Waist 28–36", sizes: ["28", "30", "32", "34", "36"] },
  { label: "Free size", sizes: ["FREE"] },
];

const defaultSizes = (): ProductSize[] =>
  DEFAULT_SIZE_LABELS.map((label) => ({ label, stock: 0 }));

const MAX_IMAGE_MB = 10;

export default function ProductForm({
  editId = null,
}: {
  editId?: string | null;
}) {
  const router = useRouter();

  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  // null until the first categories snapshot arrives.
  const [categoryDocs, setCategoryDocs] = useState<CategoryOption[] | null>(
    null,
  );
  const [productLoaded, setProductLoaded] = useState(!editId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>(defaultSizes);

  // A newer version of this product saved elsewhere while you had unsaved edits.
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);

  // Cloudinary images removed in this session — deleted after a successful save.
  const removedIds = useRef<string[]>([]);

  /*
   * Unsaved-changes tracking: `baseline` is the editor state last loaded
   * from Firestore. Live updates only replace the form while it still
   * matches the baseline, so your typing is never overwritten.
   */
  const snapshotOf = (state: {
    form: FormState;
    images: ProductImage[];
    sizes: ProductSize[];
  }) => JSON.stringify(state);
  const current = useRef({ form, images, sizes });
  current.current = { form, images, sizes };
  const baseline = useRef(snapshotOf(current.current));
  const savingRef = useRef(false);
  const isDirty = () => snapshotOf(current.current) !== baseline.current;

  const applyProduct = (product: Product) => {
    const next = {
      form: {
        title: product.title,
        description: product.description,
        price: String(product.price || ""),
        compareAtPrice: product.compareAtPrice
          ? String(product.compareAtPrice)
          : "",
        category: product.category,
        subcategory: product.subcategory,
        active: product.active,
        featured: product.featured,
      },
      images: product.images,
      sizes: product.sizes.length > 0 ? product.sizes : defaultSizes(),
    };
    setForm(next.form);
    setImages(next.images);
    setSizes(next.sizes);
    baseline.current = snapshotOf(next);
    removedIds.current = [];
    setRemoteProduct(null);
  };

  /* ---------- live categories ---------- */
  useEffect(
    () =>
      onSnapshot(
        collection(FStore, "categories"),
        (snapshot) =>
          setCategoryDocs(
            snapshot.docs
              .map((categoryDoc) => {
                const data = categoryDoc.data();
                return {
                  slug: toSlug(String(data.slug ?? categoryDoc.id)),
                  name: String(data.name ?? categoryDoc.id),
                  order: Number(data.order ?? 0),
                };
              })
              .sort((a, b) => a.order - b.order),
          ),
        (loadError) => {
          console.error(loadError);
          toast.error("Couldn't load categories. Check Firestore rules.");
          setCategoryDocs([]);
        },
      ),
    [],
  );

  /* ---------- live product (edit mode) ---------- */
  useEffect(() => {
    setNotFound(false);
    setSavedId(null);
    setErrors({});
    setRemoteProduct(null);
    removedIds.current = [];

    if (!editId) {
      setProductLoaded(true);
      return;
    }

    setProductLoaded(false);
    return subscribeProductForAdmin(
      editId,
      (product) => {
        setProductLoaded(true);

        if (!product) {
          // Deleted (possibly in another tab).
          setNotFound(true);
          return;
        }
        setNotFound(false);

        if (savingRef.current) return; // our own save echoing back
        if (isDirty()) {
          setRemoteProduct(product); // don't clobber unsaved edits — offer a reload instead
          return;
        }
        applyProduct(product);
      },
      (loadError) => {
        console.error(loadError);
        toast.error("Couldn't load product. Check Firestore rules.");
        setProductLoaded(true);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // New product: pre-select the first category once categories arrive.
  useEffect(() => {
    if (editId || !categoryDocs?.length) return;
    setForm((f) => {
      if (f.category && categoryDocs.some((c) => c.slug === f.category))
        return f;
      const next = { ...f, category: categoryDocs[0].slug };
      baseline.current = snapshotOf({ ...current.current, form: next });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, categoryDocs]);

  // Keep a legacy/deleted category selectable if the product still uses it.
  const categories = useMemo(() => {
    const list = categoryDocs ?? [];
    return form.category && !list.some((c) => c.slug === form.category)
      ? [...list, { slug: form.category, name: form.category }]
      : list;
  }, [categoryDocs, form.category]);

  const loading = categoryDocs === null || !productLoaded;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const onInput = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) =>
    setField(event.target.name as keyof FormState, event.target.value as never);

  /* ---------- images ---------- */
  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(event.target.files ?? []);
    event.target.value = "";

    const files = all.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= MAX_IMAGE_MB * 1024 * 1024,
    );
    if (files.length < all.length) {
      toast.warn(
        `Skipped ${all.length - files.length} file(s): images only, max ${MAX_IMAGE_MB}MB.`,
      );
    }
    if (files.length === 0) return;

    if (!form.category) {
      setErrors((current) => ({
        ...current,
        category: "Pick a category before uploading images.",
      }));
      return;
    }

    setErrors((current) => ({ ...current, images: "" }));
    setUploading((count) => count + files.length);

    await Promise.all(
      files.map(async (file) => {
        try {
          const uploaded = await uploadToCloudinary(
            file,
            `products/${form.category}`,
          );
          setImages((current) => [...current, uploaded]);
        } catch (uploadError) {
          console.error(uploadError);
          toast.error(
            uploadError instanceof Error
              ? `Upload failed: ${uploadError.message}`
              : "Upload failed.",
          );
        } finally {
          setUploading((count) => count - 1);
        }
      }),
    );
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const removed = current[index];
      if (removed?.publicId) removedIds.current.push(removed.publicId);
      return current.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  /* ---------- sizes ---------- */
  const updateSize = (index: number, patch: Partial<ProductSize>) => {
    setSizes((current) =>
      current.map((size, i) => (i === index ? { ...size, ...patch } : size)),
    );
    setErrors((current) => ({ ...current, sizes: "" }));
  };

  const applyPreset = (labels: string[]) => {
    setSizes((current) =>
      labels.map((label) => ({
        label,
        stock: current.find((size) => size.label === label)?.stock ?? 0,
      })),
    );
  };

  const totalUnits = sizes.reduce(
    (sum, size) => sum + (Number(size.stock) || 0),
    0,
  );

  /* ---------- save ---------- */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || uploading > 0) return;

    const price = Number(form.price);
    const compareAtPrice = Number(form.compareAtPrice);

    const cleanSizes = sizes
      .map((size) => ({
        label: size.label.trim().toUpperCase(),
        stock: Math.max(0, Math.floor(Number(size.stock) || 0)),
      }))
      .filter((size) => size.label);

    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Give the product a name.";
    if (!form.category) next.category = "Choose a category.";
    if (!(price > 0)) next.price = "Enter a price above ₹0.";
    if (form.compareAtPrice && !(compareAtPrice > price))
      next.compareAtPrice = "Must be higher than the price.";
    if (images.length === 0) next.images = "Add at least one image.";
    if (cleanSizes.length === 0) next.sizes = "Add at least one size.";
    else if (new Set(cleanSizes.map((s) => s.label)).size !== cleanSizes.length)
      next.sizes = "Each size can only appear once.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Fix the highlighted fields.");
      // Wait for the error state to render before scrolling to the first invalid field.
      requestAnimationFrame(() =>
        document
          .querySelector('[aria-invalid="true"], [data-error="true"]')
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price,
      compareAtPrice: form.compareAtPrice ? compareAtPrice : null,
      category: form.category,
      subcategory: form.subcategory.trim(),
      images,
      sizes: cleanSizes,
      active: form.active,
      featured: form.featured,
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      savingRef.current = true;

      let id = editId;
      if (editId) {
        await updateDoc(doc(FStore, PRODUCTS, editId), payload);
      } else {
        const ref = await addDoc(collection(FStore, PRODUCTS), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        id = ref.id;
      }

      await deleteFromCloudinary(removedIds.current);
      removedIds.current = [];

      // What you just saved is now the clean baseline.
      baseline.current = snapshotOf(current.current);

      if (editId) {
        toast.success("Changes saved");
        void revalidateStore({ products: true, productIds: [editId] });
      } else {
        toast.success(`"${payload.title}" added`);
        void revalidateStore({ products: true });
        setSavedId(id);
        const fresh = {
          form: { ...EMPTY_FORM, category: form.category },
          images: [],
          sizes: defaultSizes(),
        };
        setForm(fresh.form);
        setImages(fresh.images);
        setSizes(fresh.sizes);
        baseline.current = snapshotOf(fresh);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (saveError) {
      console.error(saveError);
      toast.error("Couldn't save. Check Firestore rules.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={48} width={256} />
        <Skeleton variant="rounded" height={192} />
        <Skeleton variant="rounded" height={288} />
      </Stack>
    );
  }

  if (notFound) {
    return (
      <Card sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h5">Product not found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          It may have been deleted.
        </Typography>
        <Button
          component={Link}
          href="/admin/products"
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Back to products
        </Button>
      </Card>
    );
  }

  const busy = saving || uploading > 0;
  const submitLabel =
    uploading > 0
      ? `Uploading ${uploading}…`
      : saving
        ? "Saving…"
        : editId
          ? "Save changes"
          : "Publish product";

  const submitButton = (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={busy}
      startIcon={busy ? <CircularProgress size={18} /> : undefined}
    >
      {submitLabel}
    </Button>
  );

  const rupee = {
    input: {
      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
    },
    htmlInput: { min: 0, inputMode: "numeric" as const },
  };

  const tileButton = {
    position: "absolute",
    width: 28,
    height: 28,
    color: "#fff",
    bgcolor: "rgba(0,0,0,0.7)",
    "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
    "&.Mui-disabled": { visibility: "hidden" },
  } as const;

  return (
    <>
      <Button
        component={Link}
        href="/admin/products"
        variant="text"
        size="small"
        startIcon={<ArrowBack />}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Products
      </Button>

      <PageHeader
        eyebrow={editId ? "Edit product" : "New product"}
        title={editId ? form.title || "Edit product" : "Add product"}
        actions={
          editId ? (
            <>
              <Button
                component="a"
                href={`/product/${editId}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<OpenInNew />}
              >
                View in store
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => router.push("/admin/products/new")}
              >
                New
              </Button>
            </>
          ) : undefined
        }
      />

      {remoteProduct && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{ mb: 3, alignItems: "center" }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => applyProduct(remoteProduct)}
              >
                Load latest
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setRemoteProduct(null)}
              >
                Keep mine
              </Button>
            </Stack>
          }
        >
          This product was changed in another tab. Load the latest version (your
          unsaved edits will be lost) or keep editing and save to overwrite it.
        </Alert>
      )}

      {savedId && (
        <Alert
          severity="success"
          variant="outlined"
          sx={{ mb: 3, alignItems: "center", flexWrap: "wrap" }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                component="a"
                href={`/product/${savedId}`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                variant="outlined"
                startIcon={<OpenInNew />}
              >
                View
              </Button>
              <Button
                component={Link}
                href={`/admin/products/${savedId}`}
                size="small"
                variant="outlined"
              >
                Edit it
              </Button>
            </Stack>
          }
        >
          Product published. Add another below, or:
        </Alert>
      )}

      {categories.length === 0 && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
          You need a category first.{" "}
          <MuiLink
            component={Link}
            href="/admin/categories"
            sx={{ fontWeight: 700 }}
          >
            Create one
          </MuiLink>
          .
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
          pb: { xs: 14, lg: 0 },
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {/* IMAGES */}
          <Card
            sx={{ p: { xs: 2, sm: 3 } }}
            data-error={Boolean(errors.images)}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                mb: 2,
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Typography variant="h6">Photos</Typography>
              <Typography variant="caption" color="text.secondary">
                First photo is the cover · {images.length} added
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "repeat(3, 1fr)",
                  sm: "repeat(4, 1fr)",
                },
              }}
            >
              {images.map((image, index) => (
                <Box
                  key={image.publicId || image.url}
                  sx={{
                    position: "relative",
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                    borderRadius: 2,
                    bgcolor: "var(--dc-surface-2)",
                    ...(index === 0 && {
                      outline: "2px solid var(--dc-edge)",
                      outlineOffset: 2,
                    }),
                  }}
                >
                  <Box
                    component="img"
                    src={imageUrl(image, 300, "3:4")}
                    alt=""
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                  {index === 0 && (
                    <Chip
                      label="Cover"
                      size="small"
                      color="primary"
                      sx={{ position: "absolute", left: 6, top: 6 }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    sx={{ ...tileButton, right: 6, top: 6 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    aria-label="Move earlier"
                    sx={{ ...tileButton, left: 6, bottom: 6 }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Move later"
                    sx={{ ...tileButton, right: 6, bottom: 6 }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              {Array.from({ length: uploading }).map((_, i) => (
                <Skeleton
                  key={`uploading-${i}`}
                  variant="rounded"
                  sx={{ height: "auto", aspectRatio: "3 / 4", borderRadius: 2 }}
                />
              ))}

              <ButtonBase
                component="label"
                sx={{
                  aspectRatio: "3 / 4",
                  flexDirection: "column",
                  gap: 0.5,
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: errors.images ? "error.main" : "var(--dc-line)",
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    borderColor: "var(--dc-edge)",
                  },
                }}
              >
                <AddPhotoAlternateOutlined />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Add photos
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFiles}
                />
              </ButtonBase>
            </Box>

            <FormHelperText error={Boolean(errors.images)} sx={{ mt: 1 }}>
              {errors.images ||
                `Select several at once. Images only, up to ${MAX_IMAGE_MB}MB each. 3:4 portrait looks best.`}
            </FormHelperText>
          </Card>

          {/* DETAILS */}
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2.5 }}>
              Details
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                id="title"
                name="title"
                label="Product name"
                value={form.title}
                onChange={onInput}
                placeholder="e.g. Acid Wash Oversized Tee"
                error={Boolean(errors.title)}
                helperText={errors.title}
                fullWidth
              />

              <TextField
                id="description"
                name="description"
                label="Description (optional)"
                value={form.description}
                onChange={onInput}
                placeholder="240 GSM cotton, oversized drop-shoulder fit…"
                helperText="Fabric, fit, GSM, wash care — buyers ask about these on WhatsApp."
                multiline
                minRows={5}
                fullWidth
              />

              <Box
                sx={{
                  display: "grid",
                  gap: 2.5,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
              >
                <TextField
                  select
                  id="category"
                  name="category"
                  label="Category"
                  value={form.category}
                  onChange={onInput}
                  error={Boolean(errors.category)}
                  helperText={errors.category}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Choose…
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.slug} value={category.slug}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="subcategory"
                  name="subcategory"
                  label="Style / subcategory (optional)"
                  value={form.subcategory}
                  onChange={onInput}
                  placeholder="e.g. Oversized"
                  fullWidth
                />

                <TextField
                  id="price"
                  name="price"
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={onInput}
                  placeholder="999"
                  error={Boolean(errors.price)}
                  helperText={errors.price}
                  slotProps={rupee}
                  fullWidth
                />

                <TextField
                  id="compareAtPrice"
                  name="compareAtPrice"
                  label="Compare-at price (optional)"
                  type="number"
                  value={form.compareAtPrice}
                  onChange={onInput}
                  placeholder="1499"
                  error={Boolean(errors.compareAtPrice)}
                  helperText={
                    errors.compareAtPrice ||
                    "Shown crossed out to signal a discount."
                  }
                  slotProps={rupee}
                  fullWidth
                />
              </Box>
            </Stack>
          </Card>

          {/* SIZES & STOCK */}
          <Card sx={{ p: { xs: 2, sm: 3 } }} data-error={Boolean(errors.sizes)}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "space-between", alignItems: "baseline" }}
            >
              <Typography variant="h6">Sizes &amp; stock</Typography>
              <Typography variant="caption" color="text.secondary">
                {totalUnits} units total
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              sx={{ mt: 0.5, mb: 2 }}
            >
              0 = sold out for that size. {LOW_STOCK} or fewer shows as
              &quot;only a few left&quot; in the store.
            </Typography>

            <Stack
              direction="row"
              useFlexGap
              spacing={1}
              sx={{ mb: 2, flexWrap: "wrap" }}
            >
              {SIZE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outlined"
                  size="small"
                  onClick={() => applyPreset(preset.sizes)}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>

            <Stack spacing={1}>
              {sizes.map((size, index) => {
                const stock = Number(size.stock) || 0;
                return (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <TextField
                      size="small"
                      value={size.label}
                      onChange={(e) =>
                        updateSize(index, {
                          label: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="M"
                      sx={{ width: 80, flexShrink: 0 }}
                      slotProps={{
                        htmlInput: {
                          "aria-label": `Size ${index + 1} label`,
                          style: {
                            textAlign: "center",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          },
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      value={size.stock}
                      onChange={(e) =>
                        updateSize(index, { stock: Number(e.target.value) })
                      }
                      sx={{ flex: 1, minWidth: 0 }}
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          inputMode: "numeric",
                          "aria-label": `Stock for ${size.label || "size"}`,
                          style: { textAlign: "center", fontWeight: 700 },
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconButton
                                size="small"
                                edge="start"
                                onClick={() =>
                                  updateSize(index, {
                                    stock: Math.max(0, stock - 1),
                                  })
                                }
                                aria-label={`Decrease ${size.label || "size"} stock`}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                edge="end"
                                onClick={() =>
                                  updateSize(index, { stock: stock + 1 })
                                }
                                aria-label={`Increase ${size.label || "size"} stock`}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <Chip
                      size="small"
                      label={
                        stock === 0
                          ? "Sold out"
                          : stock <= LOW_STOCK
                            ? "Low"
                            : "In stock"
                      }
                      color={
                        stock === 0
                          ? "secondary"
                          : stock <= LOW_STOCK
                            ? "default"
                            : "primary"
                      }
                      variant={
                        stock > 0 && stock <= LOW_STOCK ? "outlined" : "filled"
                      }
                      sx={{
                        width: 80,
                        display: { xs: "none", sm: "inline-flex" },
                      }}
                    />
                    <IconButton
                      onClick={() =>
                        setSizes((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove size ${size.label}`}
                      sx={{ color: "text.secondary" }}
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>

            {errors.sizes && (
              <FormHelperText error sx={{ mt: 1 }}>
                {errors.sizes}
              </FormHelperText>
            )}

            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() =>
                setSizes((current) => [...current, { label: "", stock: 0 }])
              }
              sx={{ mt: 2 }}
            >
              Add size
            </Button>
          </Card>
        </Stack>

        {/* SIDEBAR */}
        <Stack
          spacing={2}
          sx={{
            position: { lg: "sticky" },
            top: { lg: 24 },
            height: "fit-content",
          }}
        >
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Visibility
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(_, value) => setField("active", value)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Live in store
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Off saves it as a hidden draft.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.featured}
                    onChange={(_, value) => setField("featured", value)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Featured drop
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Highlight in new drops.
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </Card>

          {/* Desktop submit */}
          <Box sx={{ display: { xs: "none", lg: "block" } }}>
            {submitButton}
          </Box>
        </Stack>

        {/* Mobile sticky submit */}
        <Paper
          square
          elevation={0}
          sx={{
            display: { xs: "block", lg: "none" },
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: 20,
            borderTop: "2px solid var(--dc-edge)",
            px: 2,
            pt: 1.5,
            pb: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {submitButton}
        </Paper>
      </Box>
    </>
  );
}
