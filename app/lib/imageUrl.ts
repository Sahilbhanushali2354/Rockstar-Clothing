/*
 * Cloudinary delivery URLs — pure, no Firebase. Safe on server + client.
 */
import type { ProductImage } from "./productModel";

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/** Frame shape used for product photos. */
export type ImageAspect = "3:4" | "4:5" | "1:1";

/*
 * Optimised delivery URL. Cloudinary picks WebP/AVIF and quality per
 * device, and resizes to `width` — critical for Instagram in-app traffic.
 *
 * `aspect` → fit the WHOLE image into that frame without cropping
 * (c_pad), filling any gap with a colour sampled from the photo's edges
 * (b_auto). Without it the image keeps its own shape (c_limit).
 *
 * Legacy Firebase Storage URLs are returned unchanged — pair them with
 * `object-contain` in CSS so they're never cropped either.
 */
export function imageUrl(
  image: Pick<ProductImage, "url" | "publicId"> | undefined,
  width = 800,
  aspect?: ImageAspect,
) {
  if (!image) return "";

  const transform = aspect
    ? `f_auto,q_auto,c_pad,b_auto,ar_${aspect},w_${width}`
    : `f_auto,q_auto,c_limit,w_${width}`;

  if (image.publicId && CLOUDINARY_CLOUD_NAME) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${image.publicId}`;
  }

  if (image.url.includes("res.cloudinary.com") && image.url.includes("/upload/")) {
    return image.url.replace("/upload/", `/upload/${transform}/`);
  }

  return image.url;
}
