/*
 * Cloudinary client helpers.
 *
 * Uploads are SIGNED: the browser asks /api/cloudinary/sign (admin-only)
 * for a signature, then uploads straight to Cloudinary. The API secret
 * never reaches the browser and there is no open unsigned preset.
 */

import type { ProductImage } from "./productModel";
import { adminFetch } from "./adminApi";

// Delivery helpers live in imageUrl.ts (server-safe); re-exported for convenience.
export { CLOUDINARY_CLOUD_NAME, imageUrl, type ImageAspect } from "./imageUrl";

/** Root folder for every asset this store uploads. */
export const CLOUDINARY_ROOT = "dopamine-club";

type SignResponse = { signature: string; timestamp: number; apiKey: string; cloudName: string };

export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<ProductImage> {
  const fullFolder = `${CLOUDINARY_ROOT}/${folder}`;

  const { signature, timestamp, apiKey, cloudName } = await adminFetch<SignResponse>(
    "/api/cloudinary/sign",
    { folder: fullFolder },
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", fullFolder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Cloudinary upload failed.");
  }

  return {
    url: String(data.secure_url),
    publicId: String(data.public_id ?? ""),
  };
}

/** Best-effort delete; never blocks the caller on failure. */
export async function deleteFromCloudinary(publicIds: string[]) {
  const ids = publicIds.filter(Boolean);
  if (ids.length === 0) return;

  try {
    await adminFetch("/api/cloudinary/delete", { publicIds: ids });
  } catch (error) {
    console.warn("Cloudinary cleanup failed:", error);
  }
}

