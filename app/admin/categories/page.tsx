"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FiEdit2, FiImage, FiPackage, FiPlus, FiTrash2 } from "react-icons/fi";

import { FStore } from "@/firebase/firebase.config";
import { EmptyState, Field, Modal, PageHeader, Skeleton, Toggle } from "@/app/components/ui";
import { PRODUCTS, toSlug } from "@/app/lib/products";
import { deleteFromCloudinary, imageUrl, uploadToCloudinary } from "@/app/lib/cloudinary";
import { revalidateStore } from "@/app/lib/adminApi";

type Category = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
  imagePath: string;
  active: boolean;
  order: number;
};

type FormValues = Pick<Category, "name" | "slug" | "subtitle" | "active" | "order">;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = { name: "", slug: "", subtitle: "", active: true, order: 1 };
const MAX_IMAGE_MB = 5;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubCategories = onSnapshot(
      collection(FStore, "categories"),
      (snapshot) => {
        setCategories(
          snapshot.docs
            .map((categoryDoc) => {
              const data = categoryDoc.data();
              return {
                id: categoryDoc.id,
                name: String(data.name ?? ""),
                slug: toSlug(String(data.slug ?? categoryDoc.id)),
                subtitle: String(data.subtitle ?? ""),
                imageUrl: String(data.imageUrl ?? ""),
                imagePath: String(data.imagePath ?? ""),
                active: data.active !== false,
                order: Number(data.order ?? 0),
              };
            })
            .sort((a, b) => a.order - b.order),
        );
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Couldn't load categories.");
        setLoading(false);
      },
    );

    // Product counts per category (for badges + delete warning).
    const unsubProducts = onSnapshot(collection(FStore, PRODUCTS), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach((productDoc) => {
        const slug = toSlug(String(productDoc.data().category ?? ""));
        counts[slug] = (counts[slug] ?? 0) + 1;
      });
      setProductCounts(counts);
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  // Revoke blob previews when they change.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const nextOrder = useMemo(
    () => (categories.length ? Math.max(...categories.map((c) => c.order)) + 1 : 1),
    [categories],
  );

  /* ---------- dialog ---------- */
  const openAdd = () => {
    setEditing(null);
    setValues({ ...EMPTY, order: nextOrder });
    setErrors({});
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setValues({
      name: category.name,
      slug: category.slug,
      subtitle: category.subtitle,
      active: category.active,
      order: category.order,
    });
    setErrors({});
    setImageFile(null);
    setImagePreview(category.imageUrl ? imageUrl({ url: category.imageUrl, publicId: category.imagePath }, 600) : "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      // Auto-generate slug from name while creating.
      if (key === "name" && !editing) next.slug = toSlug(String(value));
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined, ...(key === "name" ? { slug: undefined } : {}) }));
  };

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB}MB.`);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!values.slug) next.slug = "Slug is required.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug))
      next.slug = "Lowercase letters, numbers and hyphens only.";
    else if (!editing && categories.some((category) => category.slug === values.slug))
      next.slug = "A category with this slug already exists.";
    if (!Number.isFinite(values.order) || values.order < 1) next.order = "Use 1 or higher.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      let image = editing ? { url: editing.imageUrl, publicId: editing.imagePath } : { url: "", publicId: "" };
      const oldPublicId = editing?.imagePath ?? "";

      if (imageFile) {
        image = await uploadToCloudinary(imageFile, `categories/${values.slug}`);
      }

      const payload = {
        name: values.name.trim(),
        subtitle: values.subtitle.trim(),
        imageUrl: image.url,
        imagePath: image.publicId,
        active: values.active,
        order: Number(values.order),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(FStore, "categories", editing.id), payload);
        if (imageFile && oldPublicId) await deleteFromCloudinary([oldPublicId]);
        toast.success(`${payload.name} updated`);
        void revalidateStore({ categories: true });
      } else {
        await setDoc(doc(FStore, "categories", values.slug), {
          ...payload,
          slug: values.slug,
          createdAt: serverTimestamp(),
        });
        toast.success(`${payload.name} created`);
        void revalidateStore({ categories: true });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Couldn't save category.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category, active: boolean) => {
    try {
      await updateDoc(doc(FStore, "categories", category.id), { active, updatedAt: serverTimestamp() });
      toast.success(`${category.name} ${active ? "is live" : "hidden"}`);
      void revalidateStore({ categories: true });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't update category.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(FStore, "categories", deleting.id));
      await deleteFromCloudinary([deleting.imagePath]);
      toast.success(`${deleting.name} deleted`);
      void revalidateStore({ categories: true });
      setDeleting(null);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete category.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const deletingCount = deleting ? productCounts[deleting.slug] ?? 0 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Collections shown on the home page and in the store menu. Lower order shows first."
        actions={
          <button type="button" onClick={openAdd} className="btn-brutal btn-primary btn-sm">
            <FiPlus /> New category
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create collections like Co-ord Sets, Graphic Tees or Oversized before adding products."
          action={
            <button type="button" onClick={openAdd} className="btn-brutal btn-primary btn-sm">
              <FiPlus /> New category
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const count = productCounts[category.slug] ?? 0;

            return (
              <article key={category.id} className="dc-card flex flex-col overflow-hidden">
                <div className="relative aspect-[16/10] bg-surface-2">
                  {category.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl({ url: category.imageUrl, publicId: category.imagePath }, 600)}
                      alt=""
                      loading="lazy"
                      className={`h-full w-full object-cover ${category.active ? "" : "opacity-50 grayscale"}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <FiImage className="text-2xl" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <span className="dc-badge">#{category.order}</span>
                    {!category.active && <span className="dc-badge dc-badge-muted bg-surface">Hidden</span>}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 min-w-0">
                    <h2 className="truncate font-display text-lg font-bold">{category.name}</h2>
                    <p className="truncate text-xs text-muted">/{category.slug}</p>
                    {category.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted">{category.subtitle}</p>}
                  </div>

                  <div className="mt-auto space-y-3">
                    <Toggle
                      checked={category.active}
                      onChange={(active) => toggleActive(category, active)}
                      label="Visible in store"
                    />
                    <div className="flex gap-2">
                      <Link href={`/admin/products?category=${category.slug}`} className="btn flex-1">
                        <FiPackage /> {count} {count === 1 ? "product" : "products"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="btn"
                        aria-label={`Edit ${category.name}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(category)}
                        className="btn btn-danger-soft"
                        aria-label={`Delete ${category.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / edit */}
      <Modal
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? `Edit ${editing.name}` : "New category"}
        footer={
          <>
            <button type="button" onClick={closeDialog} disabled={saving} className="btn">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-brutal btn-primary btn-sm">
              {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="dc-label">Cover image</span>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-line bg-surface-2 text-muted transition-colors hover:border-current"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm font-bold">
                  <FiImage className="text-2xl" /> Upload image
                </span>
              )}
              {imagePreview && (
                <span className="dc-badge absolute bottom-2 right-2">Change</span>
              )}
            </button>
            <p className="dc-help">JPG, PNG or WebP, up to {MAX_IMAGE_MB}MB. Landscape works best.</p>
            <input ref={fileInput} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>

          <Field label="Name" htmlFor="cat-name" error={errors.name}>
            <input
              id="cat-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Co-ord Sets"
              aria-invalid={Boolean(errors.name)}
              className="dc-input"
            />
          </Field>

          <Field
            label="URL slug"
            htmlFor="cat-slug"
            error={errors.slug}
            help={editing ? "Slug can't change after creation (it's in product links)." : `Store link: /category/${values.slug || "…"}`}
          >
            <input
              id="cat-slug"
              value={values.slug}
              onChange={(event) => update("slug", toSlug(event.target.value))}
              disabled={Boolean(editing)}
              aria-invalid={Boolean(errors.slug)}
              className="dc-input disabled:opacity-60"
            />
          </Field>

          <Field label="Subtitle" htmlFor="cat-subtitle" optional help="Short line shown under the name on the home page.">
            <input
              id="cat-subtitle"
              value={values.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
              placeholder="e.g. Matching sets, zero effort"
              className="dc-input"
            />
          </Field>

          <Field label="Display order" htmlFor="cat-order" error={errors.order} help="Lower numbers show first.">
            <input
              id="cat-order"
              type="number"
              min={1}
              value={values.order}
              onChange={(event) => update("order", Number(event.target.value))}
              aria-invalid={Boolean(errors.order)}
              className="dc-input w-32"
            />
          </Field>

          <Toggle
            checked={values.active}
            onChange={(active) => update("active", active)}
            label="Visible in store"
            description="Hidden categories don't show on the home page."
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete category?"
        footer={
          <>
            <button type="button" onClick={() => setDeleting(null)} disabled={deleteBusy} className="btn">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} disabled={deleteBusy} className="btn-brutal btn-danger btn-sm">
              {deleteBusy ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm">
          <strong>{deleting?.name}</strong> will be removed from the store.
        </p>
        {deletingCount > 0 && (
          <p className="mt-3 rounded-lg p-3 text-sm font-semibold" style={{ background: "var(--dc-surface-2)" }}>
            ⚠️ {deletingCount} {deletingCount === 1 ? "product is" : "products are"} still in this category.
            They won&apos;t be deleted, but their category page will disappear. Move or delete them first.
          </p>
        )}
      </Modal>
    </>
  );
}
