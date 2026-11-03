"use client";

import { useSyncExternalStore } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { FStore } from "@/firebase/firebase.config";
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_PATH, type StoreSettings } from "./storeSettings";

/*
 * Live storefront settings (settings/storefront), one shared Firestore
 * listener for the whole app. Starts from DEFAULT_SETTINGS so nothing
 * renders empty while loading.
 */

let settings: StoreSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();
let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = onSnapshot(
    doc(FStore, SETTINGS_PATH.collection, SETTINGS_PATH.doc),
    (snapshot) => {
      settings = normalizeSettings(snapshot.data());
      listeners.forEach((listener) => listener());
    },
    (error) => console.error("Failed to load store settings:", error),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function useStoreSettings() {
  return useSyncExternalStore(
    subscribe,
    () => settings,
    () => DEFAULT_SETTINGS,
  );
}
