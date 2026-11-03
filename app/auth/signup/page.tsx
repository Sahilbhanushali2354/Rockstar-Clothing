"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, FStore } from "@/firebase/firebase.config";
import { Field } from "@/app/components/ui";
import PasswordInput from "@/app/components/PasswordInput";
import Loader from "@/app/components/Loader";
import { authErrorMessage, isValidEmail, safeRedirect } from "../authErrors";

type Values = { name: string; email: string; phone: string; password: string };
type Errors = Partial<Record<keyof Values | "form", string>>;

function SignupForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");

  const [values, setValues] = useState<Values>({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Tell us your name.";
    if (!isValidEmail(values.email)) next.email = "Enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(values.phone)) next.phone = "Enter a 10-digit Indian mobile number.";
    if (values.password.length < 6) next.password = "Use at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, values.email.trim(), values.password);
      await updateProfile(user, { displayName: values.name.trim() });

      // Customer profile. Role is always "customer" — firestore.rules
      // blocks anyone from creating themselves as admin.
      await setDoc(doc(FStore, "users", user.uid), {
        name: values.name.trim(),
        email: user.email,
        phone: values.phone,
        role: "customer",
        createdAt: serverTimestamp(),
      });

      router.replace(safeRedirect(redirect, "/"));
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
      setSubmitting(false);
    }
  };

  return (
    <div className="dc-card-brutal p-6 sm:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Join the club</h1>
      <p className="mt-1 text-sm text-muted">Save your wishlist and get first dibs on new drops.</p>

      {errors.form && (
        <p role="alert" className="mt-5 rounded-lg p-3 text-sm font-semibold text-white" style={{ background: "var(--dc-danger)" }}>
          {errors.form}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={onChange}
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            className="dc-input"
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={onChange}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className="dc-input"
          />
        </Field>

        <Field label="WhatsApp number" htmlFor="phone" error={errors.phone} help="We'll confirm your orders here.">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">+91</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={values.phone}
              onChange={onChange}
              placeholder="98765 43210"
              aria-invalid={Boolean(errors.phone)}
              className="dc-input pl-12"
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password} help="At least 6 characters.">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={onChange}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
          />
        </Field>

        <button type="submit" disabled={submitting} className="btn-brutal btn-primary w-full">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already a member?{" "}
        <Link
          href={redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : "/auth/login"}
          className="font-bold underline"
          style={{ color: "var(--dc-text)" }}
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SignupForm />
    </Suspense>
  );
}
