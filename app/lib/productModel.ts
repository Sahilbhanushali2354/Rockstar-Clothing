/*
 * Product data model — pure TypeScript, no Firebase SDK.
 * Safe to import from server components, API routes and the browser.
 *
 * Firestore layout:
 *   products/{productId}   — every product, any category
 *   categories/{id}        — category docs (slug, name, image, order, active)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocumentData = Record<string, any>;

export const PRODUCTS = "products";

export interface ProductImage {
  url: string;
  /** Cloudinary public_id — empty for legacy Firebase Storage images. */
  publicId: string;
}

export interface ProductSize {
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Optional "was" price for showing a discount. */
  compareAtPrice: number | null;
  /** Category slug (kebab-case), matches categories/{doc}.slug */
  category: string;
  subcategory: string;
  images: ProductImage[];
  sizes: ProductSize[];
  active: boolean;
  featured: boolean;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_SIZE_LABELS = ["S", "M", "L", "XL"];

/** "t_shirts", "T Shirts", "t-shirts" → "t-shirts" */
export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugToLabel(slug: string) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
};

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/** Converts a raw Firestore doc (new or legacy shape) into a Product. */
export function normalizeProduct(id: string, data: DocumentData): Product {
  const images: ProductImage[] = Array.isArray(data.images)
    ? data.images
        .map((image: DocumentData) => ({
          url: String(image?.url ?? ""),
          publicId: String(image?.publicId ?? ""),
        }))
        .filter((image: ProductImage) => image.url)
    : data.file?.url
      ? [{ url: String(data.file.url), publicId: "" }]
      : [];

  const sizes: ProductSize[] =
    Array.isArray(data.sizes) && data.sizes.length > 0
      ? data.sizes.map((size: unknown) =>
          typeof size === "string"
            ? { label: size, stock: 0 }
            : {
                label: String((size as DocumentData)?.label ?? ""),
                stock: Math.max(
                  0,
                  Math.floor(toNumber((size as DocumentData)?.stock)),
                ),
              },
        )
      : [];

  const compareAt = toNumber(data.compareAtPrice, 0);

  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    price: toNumber(data.price),
    compareAtPrice: compareAt > 0 ? compareAt : null,
    category: toSlug(String(data.category ?? "")),
    subcategory: String(data.subcategory ?? ""),
    images,
    sizes: sizes.filter((size) => size.label),
    active: data.active !== false,
    featured: data.featured === true,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export const totalStock = (product: Pick<Product, "sizes">) =>
  product.sizes.reduce((sum, size) => sum + size.stock, 0);

export const isSoldOut = (product: Pick<Product, "sizes">) =>
  product.sizes.length > 0 && totalStock(product) === 0;

/** A size at or below this many units counts as "low stock". */
export const LOW_STOCK = 3;

export const hasLowStock = (product: Pick<Product, "sizes">) =>
  product.sizes.some((size) => size.stock > 0 && size.stock <= LOW_STOCK);


/** An active category as shown in the storefront. */
export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
  imagePath: string;
  order: number;
}
