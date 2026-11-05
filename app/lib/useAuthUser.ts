"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { auth, FStore } from "@/firebase/firebase.config";

/*
 * Current signed-in user + their role, shared across the app with a
 * single Firebase auth listener.
 */

export interface AuthState {
  /** false until Firebase has restored the session */
  ready: boolean;
  user: User | null;
  name: string;
  isAdmin: boolean;
}

const INITIAL: AuthState = { ready: false, user: null, name: "", isAdmin: false };

let state: AuthState = INITIAL;
const listeners = new Set<() => void>();
let started = false;

const emit = () => listeners.forEach((listener) => listener());

function start() {
  if (started) return;
  started = true;

  let unsubProfile: Unsubscribe | undefined;

  onAuthStateChanged(auth, (user) => {
    unsubProfile?.();
    unsubProfile = undefined;

    if (!user) {
      state = { ready: true, user: null, name: "", isAdmin: false };
      emit();
      return;
    }

    // Show the user immediately, then enrich with profile/role.
    state = { ready: true, user, name: user.displayName ?? "", isAdmin: false };
    emit();

    // Live profile: name or admin role changes apply everywhere instantly.
    unsubProfile = onSnapshot(
      doc(FStore, "users", user.uid),
      (snapshot) => {
        if (auth.currentUser?.uid !== user.uid) return;
        const data = snapshot.data();
        state = {
          ready: true,
          user,
          name: String(data?.name ?? user.displayName ?? ""),
          isAdmin: data?.role === "admin",
        };
        emit();
      },
      (error) => console.error("Failed to load profile:", error),
    );
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function useAuthUser() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

export async function logout() {
  await signOut(auth);
  try {
    localStorage.removeItem("auth");
  } catch {
    // ignore storage errors
  }
}
