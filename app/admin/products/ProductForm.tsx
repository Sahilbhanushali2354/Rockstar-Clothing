"use client";

import {
  useEffect,
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
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiImage,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { FStore } from "@/firebase/firebase.config";
import { Field, PageHeader, Skeleton, Toggle } from "@/app/components/ui";
import {
  DEFAULT_SIZE_LABELS,
  LOW_STOCK,
  PRODUCTS,
  getProductForAdmin,
  toSlug,
  type ProductImage,
  type ProductSize,
} from "@/app/lib/products";
import { deleteFromCloudinary, imageUrl, uploadToCloudinary } from "@/app/lib/cloudinary";
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

export default function ProductForm({ editId = null }: { editId?: string | null }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>(defaultSizes);

  // Cloudinary images removed in this session — deleted after a successful save.
  const removedIds = useRef<string[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);

  /* ---------- load categories + product (edit mode) ---------- */
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setSavedId(null);
        setErrors({});
        removedIds.current = [];

        const snapshot = await getDocs(collection(FStore, "categories"));
        const list = snapshot.docs
          .map((categoryDoc) => {
            const data = categoryDoc.data();
            return {
              slug: toSlug(String(data.slug ?? categoryDoc.id)),
              name: String(data.name ?? categoryDoc.id),
              order: Number(data.order ?? 0),
            };
          })
          .sort((a, b) => a.order - b.order);

        const product = editId ? await getProductForAdmin(editId) : null;
        if (!active) return;

        // Keep a legacy category selectable even if no category doc exists for it.
        if (product?.category && !list.some((c) => c.slug === product.category)) {
          list.push({ slug: product.category, name: product.category, order: 999 });
        }
        setCategories(list);

        if (editId && !product) {
          setNotFound(true);
        } else if (product) {
          setForm({
            title: product.title,
            description: product.description,
            price: String(product.price || ""),
            compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
            category: product.category,
            subcategory: product.subcategory,
            active: product.active,
            featured: product.featured,
          });
          setImages(product.images);
          setSizes(product.sizes.length > 0 ? product.sizes : defaultSizes());
        } else {
          setForm({ ...EMPTY_FORM, category: list[0]?.slug ?? "" });
          setImages([]);
          setSizes(defaultSizes());
        }
      } catch (loadError) {
        console.error(loadError);
        if (active) toast.error("Couldn't load data. Check Firestore rules.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [editId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const onInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setField(event.target.name as keyof FormState, event.target.value as never);

  /* ---------- images ---------- */
  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(event.target.files ?? []);
    event.target.value = "";

    const files = all.filter(
      (file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_MB * 1024 * 1024,
    );
    if (files.length < all.length) {
      toast.warn(`Skipped ${all.length - files.length} file(s): images only, max ${MAX_IMAGE_MB}MB.`);
    }
    if (files.length === 0) return;

    if (!form.category) {
      setErrors((current) => ({ ...current, category: "Pick a category before uploading images." }));
      return;
    }

    setErrors((current) => ({ ...current, images: "" }));
    setUploading((count) => count + files.length);

    await Promise.all(
      files.map(async (file) => {
        try {
          const uploaded = await uploadToCloudinary(file, `products/${form.category}`);
          setImages((current) => [...current, uploaded]);
        } catch (uploadError) {
          console.error(uploadError);
          toast.error(
            uploadError instanceof Error ? `Upload failed: ${uploadError.message}` : "Upload failed.",
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
    setSizes((current) => current.map((size, i) => (i === index ? { ...size, ...patch } : size)));
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

  const totalUnits = sizes.reduce((sum, size) => sum + (Number(size.stock) || 0), 0);

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
      document.querySelector('[aria-invalid="true"], [data-error="true"]')?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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

      if (editId) {
        toast.success("Changes saved");
        void revalidateStore({ products: true, productIds: [editId] });
      } else {
        toast.success(`"${payload.title}" added`);
        void revalidateStore({ products: true });
        setSavedId(id);
        setForm({ ...EMPTY_FORM, category: form.category });
        setImages([]);
        setSizes(defaultSizes());
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (saveError) {
      console.error(saveError);
      toast.error("Couldn't save. Check Firestore rules.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="dc-card p-10 text-center">
        <p className="font-display text-xl font-bold">Product not found</p>
        <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
        <Link href="/admin/products" className="btn mt-4">
          <FiArrowLeft /> Back to products
        </Link>
      </div>
    );
  }

  const busy = saving || uploading > 0;
  const submitLabel = uploading > 0 ? `Uploading ${uploading}…` : saving ? "Saving…" : editId ? "Save changes" : "Publish product";

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:underline">
        <FiArrowLeft /> Products
      </Link>

      <PageHeader
        eyebrow={editId ? "Edit product" : "New product"}
        title={editId ? form.title || "Edit product" : "Add product"}
        actions={
          editId ? (
            <>
              <a href={`/product/${editId}`} target="_blank" rel="noopener noreferrer" className="btn">
                <FiExternalLink /> View in store
              </a>
              <button type="button" onClick={() => router.push("/admin/products/new")} className="btn">
                <FiPlus /> New
              </button>
            </>
          ) : undefined
        }
      />

      {savedId && (
        <div className="dc-card mb-6 flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderColor: "var(--dc-edge)" }}>
          <p className="text-sm font-bold">✅ Product published. Add another below, or:</p>
          <div className="flex gap-2">
            <a href={`/product/${savedId}`} target="_blank" rel="noopener noreferrer" className="btn">
              <FiExternalLink /> View
            </a>
            <Link href={`/admin/products/${savedId}`} className="btn">
              Edit it
            </Link>
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="dc-card mb-6 p-4 text-sm">
          You need a category first.{" "}
          <Link href="/admin/categories" className="font-bold underline">
            Create one
          </Link>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-6 pb-28 lg:grid-cols-[1fr_300px] lg:pb-0">
        <div className="min-w-0 space-y-6">
          {/* IMAGES */}
          <section className="dc-card p-4 sm:p-6" data-error={Boolean(errors.images)}>
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Photos</h2>
              <span className="text-xs text-muted">First photo is the cover · {images.length} added</span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={image.publicId || image.url}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-2"
                  style={index === 0 ? { outline: "2px solid var(--dc-edge)", outlineOffset: 2 } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(image, 300, "3:4")} alt="" className="h-full w-full object-contain" />
                  {index === 0 && <span className="dc-badge dc-badge-live absolute left-1.5 top-1.5">Cover</span>}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <FiX />
                  </button>
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white disabled:invisible"
                      aria-label="Move earlier"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white disabled:invisible"
                      aria-label="Move later"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              ))}

              {Array.from({ length: uploading }).map((_, i) => (
                <div
                  key={`uploading-${i}`}
                  className="flex aspect-[3/4] animate-pulse items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted"
                >
                  Uploading…
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted transition-colors hover:text-current"
                style={{ borderColor: errors.images ? "var(--dc-danger)" : "var(--dc-line)" }}
              >
                <FiImage className="text-2xl" />
                <span className="text-xs font-bold">Add photos</span>
              </button>
            </div>
            {errors.images ? (
              <p className="dc-error">{errors.images}</p>
            ) : (
              <p className="dc-help">Select several at once. Images only, up to {MAX_IMAGE_MB}MB each. 3:4 portrait looks best.</p>
            )}

            <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </section>

          {/* DETAILS */}
          <section className="dc-card space-y-5 p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold">Details</h2>

            <Field label="Product name" htmlFor="title" error={errors.title}>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={onInput}
                placeholder="e.g. Acid Wash Oversized Tee"
                aria-invalid={Boolean(errors.title)}
                className="dc-input"
              />
            </Field>

            <Field label="Description" htmlFor="description" optional help="Fabric, fit, GSM, wash care — buyers ask about these on WhatsApp.">
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={onInput}
                rows={5}
                placeholder="240 GSM cotton, oversized drop-shoulder fit…"
                className="dc-input resize-y"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" htmlFor="category" error={errors.category}>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={onInput}
                  aria-invalid={Boolean(errors.category)}
                  className="dc-input"
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Style / subcategory" htmlFor="subcategory" optional>
                <input
                  id="subcategory"
                  name="subcategory"
                  value={form.subcategory}
                  onChange={onInput}
                  placeholder="e.g. Oversized"
                  className="dc-input"
                />
              </Field>

              <Field label="Price" htmlFor="price" error={errors.price}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.price}
                    onChange={onInput}
                    placeholder="999"
                    aria-invalid={Boolean(errors.price)}
                    className="dc-input pl-8"
                  />
                </div>
              </Field>

              <Field
                label="Compare-at price"
                htmlFor="compareAtPrice"
                optional
                error={errors.compareAtPrice}
                help="Shown crossed out to signal a discount."
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span>
                  <input
                    id="compareAtPrice"
                    name="compareAtPrice"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={onInput}
                    placeholder="1499"
                    aria-invalid={Boolean(errors.compareAtPrice)}
                    className="dc-input pl-8"
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* SIZES & STOCK */}
          <section className="dc-card p-4 sm:p-6" data-error={Boolean(errors.sizes)}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Sizes &amp; stock</h2>
              <span className="text-xs text-muted">{totalUnits} units total</span>
            </div>
            <p className="mb-4 text-xs text-muted">
              0 = sold out for that size. {LOW_STOCK} or fewer shows as &quot;only a few left&quot; in the store.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <button key={preset.label} type="button" onClick={() => applyPreset(preset.sizes)} className="btn" style={{ minHeight: 34 }}>
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {sizes.map((size, index) => {
                const stock = Number(size.stock) || 0;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      aria-label={`Size ${index + 1} label`}
                      value={size.label}
                      onChange={(e) => updateSize(index, { label: e.target.value.toUpperCase() })}
                      placeholder="M"
                      className="dc-input w-20 text-center font-bold uppercase"
                    />
                    <div className="flex flex-1 items-center rounded-lg border-2 border-line">
                      <button
                        type="button"
                        onClick={() => updateSize(index, { stock: Math.max(0, stock - 1) })}
                        className="h-10 w-10 shrink-0 text-lg font-bold"
                        aria-label={`Decrease ${size.label || "size"} stock`}
                      >
                        −
                      </button>
                      <input
                        aria-label={`Stock for ${size.label || "size"}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={size.stock}
                        onChange={(e) => updateSize(index, { stock: Number(e.target.value) })}
                        className="h-10 w-full min-w-0 bg-transparent text-center text-sm font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateSize(index, { stock: stock + 1 })}
                        className="h-10 w-10 shrink-0 text-lg font-bold"
                        aria-label={`Increase ${size.label || "size"} stock`}
                      >
                        +
                      </button>
                    </div>
                    <span
                      className={`dc-badge hidden w-20 justify-center sm:inline-flex ${
                        stock === 0 ? "dc-badge-ink" : stock <= LOW_STOCK ? "dc-badge-outline" : "dc-badge-live"
                      }`}
                    >
                      {stock === 0 ? "Sold out" : stock <= LOW_STOCK ? "Low" : "In stock"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizes((current) => current.filter((_, i) => i !== index))}
                      className="btn btn-ghost px-2 text-muted"
                      aria-label={`Remove size ${size.label}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>

            {errors.sizes && <p className="dc-error">{errors.sizes}</p>}

            <button
              type="button"
              onClick={() => setSizes((current) => [...current, { label: "", stock: 0 }])}
              className="btn mt-3"
            >
              <FiPlus /> Add size
            </button>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <section className="dc-card space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold">Visibility</h2>
            <Toggle
              checked={form.active}
              onChange={(value) => setField("active", value)}
              label="Live in store"
              description="Off saves it as a hidden draft."
            />
            <Toggle
              checked={form.featured}
              onChange={(value) => setField("featured", value)}
              label="Featured drop"
              description="Highlight in new drops."
            />
          </section>

          {/* Desktop submit */}
          <button type="submit" disabled={busy} className="btn-brutal btn-primary hidden w-full lg:flex">
            {submitLabel}
          </button>
        </aside>

        {/* Mobile sticky submit */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t-2 bg-surface px-4 pt-3 lg:hidden"
          style={{
            borderColor: "var(--dc-edge)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button type="submit" disabled={busy} className="btn-brutal btn-primary w-full">
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

