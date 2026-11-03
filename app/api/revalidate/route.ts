import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { AuthError, requireAdmin } from "@/app/lib/firebaseAdmin";
import { TAGS } from "@/app/lib/firestoreRest";

export const runtime = "nodejs";

/*
 * Admin-only: purge cached storefront data after an edit so the change
 * is live immediately (otherwise pages refresh on their own every 60s).
 *
 * Body: { products?, productIds?, categories?, settings? }
 */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const purged: string[] = [];

    const purge = (tag: string) => {
      revalidateTag(tag);
      purged.push(tag);
    };

    if (body?.products) purge(TAGS.products);
    if (Array.isArray(body?.productIds)) {
      body.productIds.slice(0, 50).forEach((id: unknown) => purge(TAGS.product(String(id))));
    }
    if (body?.categories) purge(TAGS.categories);
    if (body?.settings) purge(TAGS.settings);

    // Layout-level data (navbar/footer read categories + settings).
    if (body?.categories || body?.settings) revalidatePath("/", "layout");

    return NextResponse.json({ purged });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Server error.";
    return NextResponse.json({ error: message }, { status });
  }
}
