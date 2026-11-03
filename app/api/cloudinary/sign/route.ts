import { NextResponse } from "next/server";

import { AuthError, requireAdmin } from "@/app/lib/firebaseAdmin";
import { getCloudinaryConfig, signParams } from "@/app/lib/cloudinaryServer";

export const runtime = "nodejs";

/* Returns a short-lived upload signature for an admin. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const folder = String(body?.folder ?? "");

    // Only allow uploads inside the store's own folder.
    if (!/^dopamine-club(\/[a-z0-9_-]+)*$/i.test(folder)) {
      return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);

    const signature = signParams({ folder, timestamp }, apiSecret);

    return NextResponse.json({ signature, timestamp, apiKey, cloudName });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Server error.";
    return NextResponse.json({ error: message }, { status });
  }
}
