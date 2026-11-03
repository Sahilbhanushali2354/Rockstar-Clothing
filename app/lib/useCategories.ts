"use client";

import { useSyncExternalStore } from "react";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { FStore } from "@/firebase/firebase.config";
import { toSlug, type StoreCategory } from "./productModel";

export type { StoreCategory };

/*
 * Live list of ACTIVE categories, shared by every component that calls
 * useCategories() — one Firestore listener for the whole app, no matter
 * how many navbars/footers/sections render.
 */

type State = { categories: StoreCategory[]; loading: boolean };

let state: State = { categories: [], loading: true };
const listeners = new Set<() => void>();
let unsubscribe: Unsubscribe | null = null;

const emit = () => listeners.forEach((listener) => listener());

function start() {
  if (unsubscribe) return;

  unsubscribe = onSnapshot(
    collection(FStore, "categories"),
    (snapshot) => {
      state = {
        loading: false,
        categories: snapshot.docs
          .filter((categoryDoc) => categoryDoc.data().active !== false)
          .map((categoryDoc) => {
            const data = categoryDoc.data();
            return {
              id: categoryDoc.id,
              name: String(data.name ?? categoryDoc.id),
              slug: toSlug(String(data.slug ?? categoryDoc.id)),
              subtitle: String(data.subtitle ?? ""),
              imageUrl: String(data.imageUrl ?? ""),
              imagePath: String(data.imagePath ?? ""),
              order: Number(data.order ?? 0),
            };
          })
          .sort((a, b) => a.order - b.order),
      };
      emit();
    },
    (error) => {
      console.error("Failed to load categories:", error);
      state = { categories: [], loading: false };
      emit();
    },
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

const SERVER_STATE: State = { categories: [], loading: true };

export function useCategories() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}
