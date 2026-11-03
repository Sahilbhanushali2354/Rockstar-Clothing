"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, FStore } from "@/firebase/firebase.config";
import { Field } from "@/app/components/ui";
import PasswordInput from "@/app/components/PasswordInput";
import Loader from "@/app/components/Loader";
import { authErrorMessage, isValidEmail, safeRedirect } from "../authErrors";

async function destinationFor(user: User, redirect: string | null) {
  const snapshot = await getDoc(doc(FStore, "users", user.uid)).catch(() => null);
  const isAdmin = snapshot?.data()?.role === "admin";
  return safeRedirect(redirect, isAdmin ? "/admin" : "/");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Already signed in → send them where they belong.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        router.replace(await destinationFor(user, redirect));
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router, redirect]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace(await destinationFor(user, redirect));
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: "Enter your email above, then tap “Forgot password” again." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setErrors({});
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    }
  };

  if (checking) return <Loader label="Loading" />;

  return (
    <div className="dc-card-brutal p-6 sm:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to your DOPAMINE CLUB account.</p>

      {errors.form && (
        <p role="alert" className="mt-5 rounded-lg p-3 text-sm font-semibold text-white" style={{ background: "var(--dc-danger)" }}>
          {errors.form}
        </p>
      )}
      {resetSent && (
        <p role="status" className="mt-5 rounded-lg p-3 text-sm font-semibold" style={{ background: "var(--dc-acid)", color: "var(--dc-ink)" }}>
          Reset link sent to {email}. Check your inbox (and spam).
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined, form: undefined }));
            }}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className="dc-input"
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="dc-label mb-0">
              Password
            </label>
            <button type="button" onClick={handleReset} className="text-xs font-bold text-muted hover:underline">
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined, form: undefined }));
            }}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <p className="dc-error">{errors.password}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-brutal btn-primary w-full">
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={redirect ? `/auth/signup?redirect=${encodeURIComponent(redirect)}` : "/auth/signup"}
          className="font-bold underline"
          style={{ color: "var(--dc-text)" }}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginForm />
    </Suspense>
  );
}
