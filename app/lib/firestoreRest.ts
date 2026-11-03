import "server-only";

/*
 * Minimal Firestore REST reader for SERVER rendering.
 *
 * - Plain fetch → Next.js caches it (ISR) and it can be purged by tag
 *   from /api/revalidate when an admin changes data.
 * - Unauthenticated, so firestore.rules apply exactly as for a visitor:
 *   only live products / categories / settings are readable.
 */

const PROJECT_ID = "rockstar-clothing-859c4";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Revalidate cached reads at least this often (seconds). */
export const REVALIDATE_SECONDS = 60;

export const TAGS = {
  products: "products",
  product: (id: string) => `product:${id}`,
  categories: "categories",
  settings: "settings",
} as const;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
};

type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return new Date(value.timestampValue!);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields);
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue> = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

const docId = (doc: FirestoreDocument) => doc.name.split("/").pop() ?? "";

export class FirestoreReadError extends Error {}

/** One document. Returns null when missing OR not readable (hidden). */
export async function getDocument(path: string, tags: string[]) {
  const response = await fetch(`${BASE}/${path}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });

  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) throw new FirestoreReadError(`Firestore ${response.status} for ${path}`);

  const doc = (await response.json()) as FirestoreDocument;
  return { id: docId(doc), data: decodeFields(doc.fields) };
}

type Filter = { field: string; value: string | boolean };

/** Collection query with equality filters (AND). */
export async function queryCollection(collectionId: string, filters: Filter[], tags: string[]) {
  const toValue = (value: string | boolean): FirestoreValue =>
    typeof value === "boolean" ? { booleanValue: value } : { stringValue: value };

  const fieldFilters = filters.map((filter) => ({
    fieldFilter: { field: { fieldPath: filter.field }, op: "EQUAL", value: toValue(filter.value) },
  }));

  const where =
    fieldFilters.length === 0
      ? undefined
      : fieldFilters.length === 1
        ? fieldFilters[0]
        : { compositeFilter: { op: "AND", filters: fieldFilters } };

  const response = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], ...(where ? { where } : {}) } }),
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });

  if (!response.ok) throw new FirestoreReadError(`Firestore query ${response.status} on ${collectionId}`);

  const rows = (await response.json()) as { document?: FirestoreDocument }[];
  return rows
    .filter((row) => row.document)
    .map((row) => ({ id: docId(row.document!), data: decodeFields(row.document!.fields) }));
}
