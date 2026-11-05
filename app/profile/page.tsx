"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FavoriteBorder,
  Logout,
  ShoppingBagOutlined,
  WhatsApp,
} from "@mui/icons-material";

import { auth, FStore } from "@/firebase/firebase.config";
import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { useAppSelector } from "../lib/hooks";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { STORE } from "../theme/tokens";

type Profile = { name: string; phone: string; role: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    phone: "",
    role: "customer",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  // Live profile. Name/phone only refresh while you haven't edited them,
  // so typing is never overwritten; role always stays in sync.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const editable = (p: Profile) =>
    JSON.stringify({ name: p.name, phone: p.phone });
  const baseline = useRef(editable(profile));
  const savingRef = useRef(false);

  useEffect(() => {
    let unsubProfile: Unsubscribe | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setUser(firebaseUser);

      if (!firebaseUser) {
        setChecking(false);
        return;
      }

      unsubProfile = onSnapshot(
        doc(FStore, "users", firebaseUser.uid),
        (snapshot) => {
          const data = snapshot.data();
          const next: Profile = {
            name: String(data?.name ?? firebaseUser.displayName ?? ""),
            phone: String(data?.phone ?? ""),
            role: String(data?.role ?? "customer"),
          };
          setChecking(false);
          if (savingRef.current) return;

          if (editable(profileRef.current) !== baseline.current) {
            setProfile((current) => ({ ...current, role: next.role }));
          } else {
            setProfile(next);
            baseline.current = editable(next);
          }
        },
        (error) => {
          console.error("Failed to load profile:", error);
          setChecking(false);
        },
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone)) {
      setMessage({
        type: "error",
        text: "Enter a 10-digit Indian mobile number.",
      });
      return;
    }

    setSaving(true);
    savingRef.current = true;
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
      baseline.current = editable(profile);
      setMessage({ type: "ok", text: "Saved." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Couldn't save. Please try again." });
    } finally {
      savingRef.current = false;
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
        <Stack spacing={2} sx={{ mx: "auto", maxWidth: 672 }}>
          <Skeleton variant="rounded" height={56} width="66%" />
          <Skeleton variant="rounded" height={256} sx={{ borderRadius: 4 }} />
        </Stack>
      </StoreShell>
    );
  }

  /* ---------- signed out ---------- */
  if (!user) {
    return (
      <StoreShell className="py-10 sm:py-14">
        <Paper
          elevation={0}
          sx={{
            mx: "auto",
            maxWidth: 512,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2.5,
            borderRadius: 4,
            border: "2px solid var(--dc-edge)",
            px: 3,
            py: 7,
            textAlign: "center",
            boxShadow: "6px 6px 0 var(--dc-edge)",
          }}
        >
          <SectionHeader
            as="h1"
            align="center"
            title="Join the"
            highlight="club"
            description="Log in to save your details for faster WhatsApp orders."
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: -2, width: "100%", justifyContent: { sm: "center" } }}
          >
            <Button
              component={Link}
              href="/auth/login?redirect=/profile"
              variant="contained"
              color="secondary"
              size="large"
            >
              Log in
            </Button>
            <Button
              component={Link}
              href="/auth/signup?redirect=/profile"
              variant="contained"
              size="large"
            >
              Create account
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            No account needed to order — just tap{" "}
            <Box component="strong">Buy via WhatsApp</Box> on any product.
          </Typography>
        </Paper>
      </StoreShell>
    );
  }

  /* ---------- signed in ---------- */
  const firstName = (profile.name || user.email || "there").split(" ")[0];

  const tile = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1.5,
    borderRadius: 3,
    border: "2px solid var(--dc-edge)",
    bgcolor: "var(--dc-surface)",
    p: 2,
    fontSize: 16,
    fontWeight: 700,
    textTransform: "none",
    letterSpacing: 0,
    color: "text.primary",
    boxShadow: "none",
    transition: "box-shadow 150ms",
    "&:hover": {
      bgcolor: "var(--dc-surface)",
      boxShadow: "4px 4px 0 var(--dc-edge)",
      transform: "none",
    },
  } as const;

  const countChip = {
    height: 22,
    borderRadius: 1,
    border: "1.5px solid var(--dc-edge)",
    bgcolor: "var(--dc-surface)",
  } as const;

  return (
    <StoreShell className="py-10 sm:py-14">
      <Box sx={{ mx: "auto", maxWidth: 768 }}>
        <SectionHeader
          as="h1"
          eyebrow="Account"
          title="Hey"
          highlight={`${firstName} 👋`}
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 260px" },
          }}
        >
          <Paper
            component="form"
            onSubmit={handleSave}
            noValidate
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "2px solid var(--dc-edge)",
              p: { xs: 2.5, sm: 3 },
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2" sx={{ fontSize: 20 }}>
                Your details
              </Typography>

              <TextField
                id="name"
                label="Name"
                autoComplete="name"
                value={profile.name}
                onChange={(event) =>
                  setProfile((p) => ({ ...p, name: event.target.value }))
                }
                fullWidth
              />

              <TextField
                id="email"
                label="Email"
                value={user.email ?? ""}
                disabled
                helperText="Contact us on WhatsApp to change your email."
                fullWidth
              />

              <TextField
                id="phone"
                label="WhatsApp number"
                type="tel"
                autoComplete="tel-national"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((p) => ({
                    ...p,
                    phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                helperText="We confirm orders on this number."
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

              {message && (
                <Alert
                  severity={message.type === "ok" ? "success" : "error"}
                  variant="filled"
                  sx={
                    message.type === "ok"
                      ? { bgcolor: "var(--dc-acid)", color: "var(--dc-ink)" }
                      : undefined
                  }
                >
                  {message.text}
                </Alert>
              )}

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  startIcon={
                    saving ? <CircularProgress size={18} /> : undefined
                  }
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {saving ? "Saving…" : "Save details"}
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Stack component="aside" spacing={1.5}>
            <Button component={Link} href="/wishlist" sx={tile}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <FavoriteBorder fontSize="small" />{" "}
                <Box component="span">Wishlist</Box>
              </Stack>
              <Chip size="small" label={wishlistCount} sx={countChip} />
            </Button>
            <Button component={Link} href="/cart" sx={tile}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <ShoppingBagOutlined fontSize="small" />{" "}
                <Box component="span">Cart</Box>
              </Stack>
              <Chip size="small" label={cartCount} sx={countChip} />
            </Button>
            <Button
              component="a"
              href={buildWhatsAppUrl(
                `Hey ${STORE.name}! 👋 I need help with my order.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsApp />}
              sx={{
                ...tile,
                justifyContent: "flex-start",
                borderColor: "var(--dc-ink)",
                bgcolor: "var(--dc-acid)",
                color: "var(--dc-ink)",
                "&:hover": { ...tile["&:hover"], bgcolor: "var(--dc-acid)" },
              }}
            >
              Order help
            </Button>
            {profile.role === "admin" && (
              <Button
                component={Link}
                href="/admin"
                sx={{
                  ...tile,
                  justifyContent: "flex-start",
                  bgcolor: "transparent",
                }}
              >
                Admin dashboard →
              </Button>
            )}
            <Button
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{
                ...tile,
                justifyContent: "flex-start",
                borderColor: "var(--dc-line)",
                bgcolor: "transparent",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "error.main",
                  color: "error.main",
                  bgcolor: "transparent",
                },
              }}
            >
              Log out
            </Button>
          </Stack>
        </Box>
      </Box>
    </StoreShell>
  );
}
