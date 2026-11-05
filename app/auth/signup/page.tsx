"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Alert,
  Button,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { auth, FStore } from "@/firebase/firebase.config";
import PasswordInput from "@/app/components/PasswordInput";
import Loader from "@/app/components/Loader";
import { authErrorMessage, isValidEmail, safeRedirect } from "../authErrors";

type Values = { name: string; email: string; phone: string; password: string };
type Errors = Partial<Record<keyof Values | "form", string>>;

function SignupForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");

  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      form: undefined,
    }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Tell us your name.";
    if (!isValidEmail(values.email))
      next.email = "Enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(values.phone))
      next.phone = "Enter a 10-digit Indian mobile number.";
    if (values.password.length < 6)
      next.password = "Use at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password,
      );
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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        border: "2px solid var(--dc-edge)",
        boxShadow: "6px 6px 0 var(--dc-edge)",
      }}
    >
      <Typography variant="h4" component="h1" sx={{ fontSize: 30 }}>
        Join the club
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Save your wishlist and get first dibs on new drops.
      </Typography>

      {errors.form && (
        <Alert severity="error" variant="filled" sx={{ mt: 2.5 }}>
          {errors.form}
        </Alert>
      )}

      <Stack
        component="form"
        onSubmit={handleSubmit}
        noValidate
        spacing={2.5}
        sx={{ mt: 3 }}
      >
        <TextField
          id="name"
          name="name"
          label="Name"
          autoComplete="name"
          value={values.name}
          onChange={onChange}
          placeholder="Your name"
          error={Boolean(errors.name)}
          helperText={errors.name}
          fullWidth
        />

        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={onChange}
          placeholder="you@example.com"
          error={Boolean(errors.email)}
          helperText={errors.email}
          slotProps={{ htmlInput: { inputMode: "email" } }}
          fullWidth
        />

        <TextField
          id="phone"
          name="phone"
          label="WhatsApp number"
          type="tel"
          autoComplete="tel-national"
          value={values.phone}
          onChange={onChange}
          placeholder="98765 43210"
          error={Boolean(errors.phone)}
          helperText={errors.phone || "We'll confirm your orders here."}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
            input: {
              startAdornment: (
                <InputAdornment position="start">+91</InputAdornment>
              ),
            },
          }}
          fullWidth
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={onChange}
          placeholder="••••••••"
          error={Boolean(errors.password)}
          helperText={errors.password || "At least 6 characters."}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, textAlign: "center" }}
      >
        Already a member?{" "}
        <MuiLink
          component={Link}
          href={
            redirect
              ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
              : "/auth/login"
          }
          color="text.primary"
          sx={{ fontWeight: 700 }}
        >
          Log in
        </MuiLink>
      </Typography>
    </Paper>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SignupForm />
    </Suspense>
  );
}
