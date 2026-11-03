"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { FiHeart, FiLogOut, FiShoppingBag } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import { auth, FStore } from "@/firebase/firebase.config";
import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { Field } from "../components/ui";
import { useAppSelector } from "../lib/hooks";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { STORE } from "../theme/tokens";

type Profile = { name: string; phone: string; role: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile>({ name: "", phone: "", role: "customer" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snapshot = await getDoc(doc(FStore, "users", firebaseUser.uid)).catch(() => null);
        const data = snapshot?.data();
        setProfile({
          name: String(data?.name ?? firebaseUser.displayName ?? ""),
          phone: String(data?.phone ?? ""),
          role: String(data?.role ?? "customer"),
        });
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone)) {
      setMessage({ type: "error", text: "Enter a 10-digit Indian mobile number." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(user, { displayName: profile.name.trim() });
      // role is preserved exactly (firestore.rules reject role changes)
      await setDoc(
        doc(FStore, "users", user.uid),
        {
          name: profile.name.trim(),
          phone: profile.phone,
          email: user.email,
          role: profile.role,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setMessage({ type: "ok", text: "Saved." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Couldn't save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("auth");
    router.replace("/");
  };

  if (checking) {
    return (
      <StoreShell className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-14 w-2/3 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </StoreShell>
    );
  }

  /* ---------- signed out ---------- */
  if (!user) {
    return (
      <StoreShell className="py-10 sm:py-14">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5 rounded-2xl border-2 border-edge bg-surface px-6 py-14 text-center shadow-brutal-lg">
          <SectionHeader as="h1" align="center" title="Join the" highlight="club" description="Log in to save your details for faster WhatsApp orders." />
          <div className="-mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/login?redirect=/profile" className="btn-brutal btn-ink">
              Log in
            </Link>
            <Link href="/auth/signup?redirect=/profile" className="btn-brutal btn-primary">
              Create account
            </Link>
          </div>
          <p className="text-sm text-muted">
            No account needed to order — just tap <strong>Buy via WhatsApp</strong> on any product.
          </p>
        </div>
      </StoreShell>
    );
  }

  /* ---------- signed in ---------- */
  const firstName = (profile.name || user.email || "there").split(" ")[0];

  return (
    <StoreShell className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <SectionHeader as="h1" eyebrow="Account" title="Hey" highlight={`${firstName} 👋`} />

        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <form onSubmit={handleSave} noValidate className="space-y-4 rounded-2xl border-2 border-edge bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">Your details</h2>

            <Field label="Name" htmlFor="name">
              <input
                id="name"
                autoComplete="name"
                value={profile.name}
                onChange={(event) => setProfile((p) => ({ ...p, name: event.target.value }))}
                className="dc-input"
              />
            </Field>

            <Field label="Email" htmlFor="email" help="Contact us on WhatsApp to change your email.">
              <input id="email" value={user.email ?? ""} disabled className="dc-input opacity-60" />
            </Field>

            <Field label="WhatsApp number" htmlFor="phone" help="We confirm orders on this number.">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((p) => ({ ...p, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  className="dc-input pl-12"
                />
              </div>
            </Field>

            {message && (
              <p
                role={message.type === "error" ? "alert" : "status"}
                className={`rounded-lg p-3 text-sm font-bold ${message.type === "ok" ? "bg-acid text-ink" : "bg-danger text-white"}`}
              >
                {message.text}
              </p>
            )}

            <button type="submit" disabled={saving} className="btn-brutal btn-primary w-full sm:w-auto">
              {saving ? "Saving…" : "Save details"}
            </button>
          </form>

          <aside className="space-y-3">
            <Link href="/wishlist" className="flex items-center justify-between rounded-xl border-2 border-edge bg-surface p-4 font-bold transition-shadow hover:shadow-brutal">
              <span className="flex items-center gap-3">
                <FiHeart /> Wishlist
              </span>
              <span className="dc-badge">{wishlistCount}</span>
            </Link>
            <Link href="/cart" className="flex items-center justify-between rounded-xl border-2 border-edge bg-surface p-4 font-bold transition-shadow hover:shadow-brutal">
              <span className="flex items-center gap-3">
                <FiShoppingBag /> Cart
              </span>
              <span className="dc-badge">{cartCount}</span>
            </Link>
            <a
              href={buildWhatsAppUrl(`Hey ${STORE.name}! 👋 I need help with my order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border-2 border-ink bg-acid p-4 font-bold text-ink"
            >
              <FaWhatsapp className="text-lg" /> Order help
            </a>
            {profile.role === "admin" && (
              <Link href="/admin" className="flex items-center gap-3 rounded-xl border-2 border-edge p-4 font-bold">
                Admin dashboard →
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-line p-4 font-bold text-muted hover:border-danger hover:text-danger"
            >
              <FiLogOut /> Log out
            </button>
          </aside>
        </div>
      </div>
    </StoreShell>
  );
}
