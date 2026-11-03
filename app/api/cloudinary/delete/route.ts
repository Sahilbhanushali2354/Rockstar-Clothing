import { NextResponse } from "next/server";

import { AuthError, requireAdmin } from "@/app/lib/firebaseAdmin";
import { getCloudinaryConfig, signParams } from "@/app/lib/cloudinaryServer";

export const runtime = "nodejs";

/* Deletes images (by public_id) when an admin removes them from a product. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const publicIds: string[] = Array.isArray(body?.publicIds)
      ? body.publicIds.map(String).filter((id: string) =>
          id.startsWith("dopamine-club/"),
        )
      : [];

    if (publicIds.length === 0) {
      return NextResponse.json({ deleted: [] });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    const results = await Promise.all(
      publicIds.slice(0, 20).map(async (publicId) => {
        const timestamp = Math.round(Date.now() / 1000);
        const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

        const form = new URLSearchParams({
          public_id: publicId,
          timestamp: String(timestamp),
          api_key: apiKey,
          signature,
        });

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          { method: "POST", body: form },
        );

        const data = await response.json().catch(() => ({}));
        return { publicId, result: data?.result ?? "error" };
      }),
    );

    return NextResponse.json({ deleted: results });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Server error.";
    return NextResponse.json({ error: message }, { status });
  }
}
