"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  FormHelperText,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutlined,
  EditOutlined,
  ImageOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";

import { FStore } from "@/firebase/firebase.config";
import {
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
  Toggle,
} from "@/app/components/ui";
import { PRODUCTS, toSlug } from "@/app/lib/products";
import {
  deleteFromCloudinary,
  imageUrl,
  uploadToCloudinary,
} from "@/app/lib/cloudinary";
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

type FormValues = Pick<
  Category,
  "name" | "slug" | "subtitle" | "active" | "order"
>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  name: "",
  slug: "",
  subtitle: "",
  active: true,
  order: 1,
};
const MAX_IMAGE_MB = 5;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );
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
    const unsubProducts = onSnapshot(
      collection(FStore, PRODUCTS),
      (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.docs.forEach((productDoc) => {
          const slug = toSlug(String(productDoc.data().category ?? ""));
          counts[slug] = (counts[slug] ?? 0) + 1;
        });
        setProductCounts(counts);
      },
    );

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
    () =>
      categories.length ? Math.max(...categories.map((c) => c.order)) + 1 : 1,
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
    setImagePreview(
      category.imageUrl
        ? imageUrl(
            { url: category.imageUrl, publicId: category.imagePath },
            600,
          )
        : "",
    );
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
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === "name" ? { slug: undefined } : {}),
    }));
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
    else if (
      !editing &&
      categories.some((category) => category.slug === values.slug)
    )
      next.slug = "A category with this slug already exists.";
    if (!Number.isFinite(values.order) || values.order < 1)
      next.order = "Use 1 or higher.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      let image = editing
        ? { url: editing.imageUrl, publicId: editing.imagePath }
        : { url: "", publicId: "" };
      const oldPublicId = editing?.imagePath ?? "";

      if (imageFile) {
        image = await uploadToCloudinary(
          imageFile,
          `categories/${values.slug}`,
        );
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
      toast.error(
        error instanceof Error ? error.message : "Couldn't save category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category, active: boolean) => {
    try {
      await updateDoc(doc(FStore, "categories", category.id), {
        active,
        updatedAt: serverTimestamp(),
      });
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

  const deletingCount = deleting ? (productCounts[deleting.slug] ?? 0) : 0;

  const newButton = (
    <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
      New category
    </Button>
  );

  const grid = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, 1fr)",
      lg: "repeat(3, 1fr)",
    },
  } as const;

  const badge = {
    height: 22,
    borderRadius: 1,
    border: "1.5px solid var(--dc-edge)",
    bgcolor: "var(--dc-surface)",
    fontSize: 11,
  } as const;

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Collections shown on the home page and in the store menu. Lower order shows first."
        actions={newButton}
      />

      {loading ? (
        <Box sx={grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </Box>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create collections like Co-ord Sets, Graphic Tees or Oversized before adding products."
          action={newButton}
        />
      ) : (
        <Box sx={grid}>
          {categories.map((category) => {
            const count = productCounts[category.slug] ?? 0;

            return (
              <Card
                component="article"
                key={category.id}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "16 / 10",
                    bgcolor: "var(--dc-surface-2)",
                  }}
                >
                  {category.imageUrl ? (
                    <Box
                      component="img"
                      src={imageUrl(
                        {
                          url: category.imageUrl,
                          publicId: category.imagePath,
                        },
                        600,
                      )}
                      alt=""
                      loading="lazy"
                      sx={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        ...(!category.active && {
                          opacity: 0.5,
                          filter: "grayscale(1)",
                        }),
                      }}
                    />
                  ) : (
                    <Stack
                      sx={{
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                      }}
                    >
                      <ImageOutlined sx={{ fontSize: 28 }} />
                    </Stack>
                  )}
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ position: "absolute", left: 8, top: 8 }}
                  >
                    <Chip
                      size="small"
                      label={`#${category.order}`}
                      sx={badge}
                    />
                    {!category.active && (
                      <Chip
                        size="small"
                        label="Hidden"
                        sx={{
                          ...badge,
                          borderColor: "var(--dc-line)",
                          color: "text.secondary",
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                <Stack sx={{ flex: 1, p: 2 }}>
                  <Box sx={{ mb: 1.5, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      noWrap
                      sx={{ fontSize: 18 }}
                    >
                      {category.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      /{category.slug}
                    </Typography>
                    {category.subtitle && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {category.subtitle}
                      </Typography>
                    )}
                  </Box>

                  <Stack spacing={1.5} sx={{ mt: "auto" }}>
                    <Toggle
                      checked={category.active}
                      onChange={(active) => toggleActive(category, active)}
                      label="Visible in store"
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        component={Link}
                        href={`/admin/products?category=${category.slug}`}
                        variant="outlined"
                        size="small"
                        startIcon={<Inventory2Outlined />}
                        sx={{
                          flex: 1,
                          textTransform: "none",
                          letterSpacing: 0,
                        }}
                      >
                        {count} {count === 1 ? "product" : "products"}
                      </Button>
                      <IconButton
                        onClick={() => openEdit(category)}
                        aria-label={`Edit ${category.name}`}
                        sx={{
                          border: "1.5px solid var(--dc-line)",
                          "&:hover": { borderColor: "var(--dc-edge)" },
                        }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => setDeleting(category)}
                        aria-label={`Delete ${category.name}`}
                        sx={{
                          color: "error.main",
                          border: "1.5px solid var(--dc-line)",
                          "&:hover": { borderColor: "error.main" },
                        }}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Add / edit */}
      <Modal
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? `Edit ${editing.name}` : "New category"}
        footer={
          <>
            <Button variant="outlined" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 700 }}>
              Cover image
            </Typography>
            <ButtonBase
              component="label"
              sx={{
                position: "relative",
                display: "flex",
                aspectRatio: "16 / 9",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 2,
                border: "2px dashed var(--dc-line)",
                bgcolor: "var(--dc-surface-2)",
                color: "text.secondary",
                transition: "border-color 150ms",
                "&:hover": { borderColor: "var(--dc-edge)" },
              }}
            >
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Stack
                  spacing={0.5}
                  sx={{ alignItems: "center", fontSize: 14, fontWeight: 700 }}
                >
                  <ImageOutlined sx={{ fontSize: 28 }} /> Upload image
                </Stack>
              )}
              {imagePreview && (
                <Chip
                  size="small"
                  label="Change"
                  sx={{ ...badge, position: "absolute", bottom: 8, right: 8 }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImage}
              />
            </ButtonBase>
            <FormHelperText sx={{ mx: 0 }}>
              JPG, PNG or WebP, up to {MAX_IMAGE_MB}MB. Landscape works best.
            </FormHelperText>
          </Box>

          <TextField
            id="cat-name"
            label="Name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Co-ord Sets"
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />

          <TextField
            id="cat-slug"
            label="URL slug"
            value={values.slug}
            onChange={(event) => update("slug", toSlug(event.target.value))}
            disabled={Boolean(editing)}
            error={Boolean(errors.slug)}
            helperText={
              errors.slug ||
              (editing
                ? "Slug can't change after creation (it's in product links)."
                : `Store link: /category/${values.slug || "…"}`)
            }
            fullWidth
          />

          <TextField
            id="cat-subtitle"
            label="Subtitle (optional)"
            value={values.subtitle}
            onChange={(event) => update("subtitle", event.target.value)}
            placeholder="e.g. Matching sets, zero effort"
            helperText="Short line shown under the name on the home page."
            fullWidth
          />

          <TextField
            id="cat-order"
            label="Display order"
            type="number"
            value={values.order}
            onChange={(event) => update("order", Number(event.target.value))}
            error={Boolean(errors.order)}
            helperText={errors.order || "Lower numbers show first."}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 160 }}
          />

          <Toggle
            checked={values.active}
            onChange={(active) => update("active", active)}
            label="Visible in store"
            description="Hidden categories don't show on the home page."
          />
        </Stack>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete category?"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleteBusy}
              sx={{ color: "#fff" }}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          <Box component="strong">{deleting?.name}</Box> will be removed from
          the store.
        </Typography>
        {deletingCount > 0 && (
          <Alert severity="warning" sx={{ mt: 1.5, fontWeight: 600 }}>
            {deletingCount}{" "}
            {deletingCount === 1 ? "product is" : "products are"} still in this
            category. They won&apos;t be deleted, but their category page will
            disappear. Move or delete them first.
          </Alert>
        )}
      </Modal>
    </>
  );
}
