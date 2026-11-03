/*
 * Removes password-like fields from every document in `users`.
 *
 * Passwords belong ONLY in Firebase Authentication (which stores them
 * hashed). Plain-text copies in Firestore must be deleted.
 *
 * SAFE BY DEFAULT: dry run — lists affected users, changes nothing.
 *
 *   npm run clean:user-passwords              # dry run
 *   npm run clean:user-passwords -- --commit  # delete the fields
 *
 * Output never prints the password values themselves.
 */

import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const COMMIT = process.argv.includes("--commit");
const SECRET_FIELDS = ["password", "confirmPassword", "passwordHash", "pass", "pwd"];

const missing = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].filter(
  (key) => !process.env[key],
);
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

async function main() {
  console.log(COMMIT ? "== COMMIT MODE: deleting fields ==" : "== DRY RUN (add --commit to delete) ==");

  const snapshot = await db.collection("users").get();
  let affected = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const found = SECRET_FIELDS.filter((field) => field in data);
    if (found.length === 0) continue;

    affected++;
    const label = data.email ? String(data.email) : userDoc.id;
    console.log(`  ${label}: ${found.join(", ")}`);

    if (COMMIT) {
      await userDoc.ref.update(Object.fromEntries(found.map((field) => [field, FieldValue.delete()])));
    }
  }

  console.log(
    `\n${snapshot.size} users checked, ${affected} had password fields${COMMIT ? " — removed." : "."}`,
  );
  if (!COMMIT && affected) console.log("Nothing was changed. Re-run with --commit.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
