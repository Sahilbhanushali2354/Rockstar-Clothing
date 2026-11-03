import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/*
 * Server-side Firebase (API routes only). Needs a service account:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Put them in .env (git-ignored) and in Vercel env vars.
 */
function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Verifies the Bearer ID token and that users/{uid}.role === "admin". */
export async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) throw new AuthError("Missing auth token.", 401);

  const app = getAdminApp();

  let uid: string;
  try {
    ({ uid } = await getAuth(app).verifyIdToken(token));
  } catch {
    throw new AuthError("Invalid or expired session.", 401);
  }

  const userDoc = await getFirestore(app).collection("users").doc(uid).get();

  if (userDoc.data()?.role !== "admin") {
    throw new AuthError("Admin access required.", 403);
  }

  return uid;
}
