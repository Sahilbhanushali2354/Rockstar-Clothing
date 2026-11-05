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
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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

async function destinationFor(user: User, redirect: string | null) {
  const snapshot = await getDoc(doc(FStore, "users", user.uid)).catch(
    () => null,
  );
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
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
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
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      router.replace(await destinationFor(user, redirect));
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!isValidEmail(email)) {
      setErrors({
        email: "Enter your email above, then tap “Forgot password” again.",
      });
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
        Welcome back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Log in to your DOPAMINE CLUB account.
      </Typography>

      {errors.form && (
        <Alert severity="error" variant="filled" sx={{ mt: 2.5 }}>
          {errors.form}
        </Alert>
      )}
      {resetSent && (
        <Alert
          severity="success"
          variant="filled"
          sx={{ mt: 2.5, bgcolor: "var(--dc-acid)", color: "var(--dc-ink)" }}
        >
          Reset link sent to {email}. Check your inbox (and spam).
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
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({
              ...current,
              email: undefined,
              form: undefined,
            }));
          }}
          placeholder="you@example.com"
          error={Boolean(errors.email)}
          helperText={errors.email}
          slotProps={{ htmlInput: { inputMode: "email" } }}
          fullWidth
        />

        <Box>
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                password: undefined,
                form: undefined,
              }));
            }}
            placeholder="••••••••"
            error={Boolean(errors.password)}
            helperText={errors.password}
          />
          <Box sx={{ mt: 0.75, textAlign: "right" }}>
            <Button
              variant="text"
              size="small"
              onClick={handleReset}
              sx={{
                minHeight: 0,
                p: 0,
                fontSize: 12,
                textTransform: "none",
                letterSpacing: 0,
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              Forgot password?
            </Button>
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
        >
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, textAlign: "center" }}
      >
        New here?{" "}
        <MuiLink
          component={Link}
          href={
            redirect
              ? `/auth/signup?redirect=${encodeURIComponent(redirect)}`
              : "/auth/signup"
          }
          color="text.primary"
          sx={{ fontWeight: 700 }}
        >
          Create an account
        </MuiLink>
      </Typography>
    </Paper>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginForm />
    </Suspense>
  );
}
