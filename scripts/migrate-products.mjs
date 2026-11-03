/*
 * One-time migration: per-category collections (jeans, t_shirts, …)
 *                     → single `products` collection.
 *
 * SAFE BY DEFAULT: runs as a dry run and only prints what it would do.
 * Old collections are never modified or deleted — delete them yourself
 * in the Firebase console once the new store looks right.
 *
 * Usage (Node 20+, reads credentials from .env):
 *   node --env-file=.env scripts/migrate-products.mjs                 # dry run
 *   node --env-file=.env scripts/migrate-products.mjs --commit        # write
 *   node --env-file=.env scripts/migrate-products.mjs --commit --cloudinary
 *        (also copies each Firebase Storage image into Cloudinary)
 *   --stock=10   stock given to each default size (default 10)
 *
 * Re-running is safe: products that already exist in `products` are skipped,
 * and they keep the same document ID so old links keep working.
 */

import { createHash } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const TO_CLOUDINARY = args.includes("--cloudinary");
const DEFAULT_STOCK = Number(
  args.find((arg) => arg.startsWith("--stock="))?.split("=")[1] ?? 10,
);
const DEFAULT_SIZES = ["S", "M", "L", "XL"];

// Collections that are NOT legacy product categories.
const SKIP = new Set(["categories", "users", "orders", "products", "settings", "banners"]);

const required = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
if (TO_CLOUDINARY) {
  required.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");
}
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")} (add them to .env)`);
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

const toSlug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function copyToCloudinary(url, folder) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new URLSearchParams({
    file: url, // Cloudinary fetches the remote URL itself
    folder,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "upload failed");
  return { url: data.secure_url, publicId: data.public_id };
}

async function main() {
  console.log(COMMIT ? "== COMMIT MODE: writing to Firestore ==" : "== DRY RUN (add --commit to write) ==");

  const categorySlugs = new Set(
    (await db.collection("categories").get()).docs.map((d) => toSlug(d.data().slug ?? d.id)),
  );

  const collections = (await db.listCollections()).filter((c) => !SKIP.has(c.id));
  const stats = { migrated: 0, skipped: 0, failed: 0, uploaded: 0 };

  for (const legacy of collections) {
    const category = toSlug(legacy.id);
    const snapshot = await legacy.get();

    console.log(`\n[${legacy.id}] → category "${category}" (${snapshot.size} docs)`);
    if (!categorySlugs.has(category)) {
      console.warn(`  ! No categories doc with slug "${category}". Create it in /admin/category so the page shows a name and image.`);
    }

    for (const legacyDoc of snapshot.docs) {
      const data = legacyDoc.data();
      const target = db.collection("products").doc(legacyDoc.id);

      try {
        if ((await target.get()).exists) {
          stats.skipped++;
          console.log(`  - ${legacyDoc.id} already migrated, skipping`);
          continue;
        }

        let images = data.file?.url ? [{ url: String(data.file.url), publicId: "" }] : [];
        const isVideo = String(data.file?.type ?? "").startsWith("video/");

        if (TO_CLOUDINARY && COMMIT && images[0] && !isVideo) {
          images = [await copyToCloudinary(images[0].url, `dopamine-club/products/${category}`)];
          stats.uploaded++;
        }

        const sizes =
          Array.isArray(data.sizes) && data.sizes.length
            ? data.sizes.map((s) => (typeof s === "string" ? { label: s, stock: DEFAULT_STOCK } : s))
            : DEFAULT_SIZES.map((label) => ({ label, stock: DEFAULT_STOCK }));

        const price = Number(data.price);

        const product = {
          title: String(data.title ?? "").trim(),
          description: String(data.description ?? "").trim(),
          price: Number.isFinite(price) ? price : 0,
          compareAtPrice: null,
          category,
          subcategory: String(data.subcategory ?? ""),
          images,
          sizes,
          active: true,
          featured: false,
          createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          legacy: { collection: legacy.id, migratedAt: new Date().toISOString() },
        };

        if (!product.title || !(product.price > 0) || images.length === 0) {
          console.warn(`  ! ${legacyDoc.id} "${product.title}" missing title/price/image — migrating as HIDDEN`);
          product.active = false;
        }

        if (COMMIT) await target.set(product);
        stats.migrated++;
        console.log(`  ✓ ${legacyDoc.id} "${product.title}" ₹${product.price}${isVideo ? " (video kept as-is)" : ""}`);
      } catch (error) {
        stats.failed++;
        console.error(`  ✗ ${legacyDoc.id}: ${error.message}`);
      }
    }
  }

  console.log(`\nDone. ${COMMIT ? "Migrated" : "Would migrate"}: ${stats.migrated}, already done: ${stats.skipped}, failed: ${stats.failed}${TO_CLOUDINARY ? `, images copied to Cloudinary: ${stats.uploaded}` : ""}`);
  if (!COMMIT) console.log("Nothing was written. Re-run with --commit.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
