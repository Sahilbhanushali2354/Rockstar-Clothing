"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { OpenInNew, RestartAlt } from "@mui/icons-material";

import { FStore } from "@/firebase/firebase.config";
import { PageHeader, Skeleton } from "@/app/components/ui";
import Marquee from "@/app/components/store/Marquee";
import { revalidateStore } from "@/app/lib/adminApi";
import {
  DEFAULT_SETTINGS,
  instagramUrl,
  normalizeSettings,
  SETTINGS_PATH,
  type StoreSettings,
} from "@/app/lib/storeSettings";

/* Lists are edited as one item per line. */
type FormState = Omit<StoreSettings, "announcements" | "tickerItems"> & {
  announcements: string;
  tickerItems: string;
};

const toForm = (settings: StoreSettings): FormState => ({
  ...settings,
  announcements: settings.announcements.join("\n"),
  tickerItems: settings.tickerItems.join("\n"),
});

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function StoreSettingsPage() {
  const [form, setForm] = useState<FormState>(toForm(DEFAULT_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(FStore, SETTINGS_PATH.collection, SETTINGS_PATH.doc))
      .then((snapshot) => setForm(toForm(normalizeSettings(snapshot.data()))))
      .catch((error) => {
        console.error(error);
        toast.error("Couldn't load settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const preview = normalizeSettings({
    ...form,
    announcements: lines(form.announcements),
    tickerItems: lines(form.tickerItems),
  });

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(FStore, SETTINGS_PATH.collection, SETTINGS_PATH.doc), {
        ...preview,
        updatedAt: serverTimestamp(),
      });
      await revalidateStore({ settings: true });
      toast.success("Store updated");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save. Check Firestore rules.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-80" />
      </Stack>
    );
  }

  const card = { p: { xs: 2, sm: 3 } } as const;
  const mono = {
    "& textarea": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
    },
  } as const;

  const submitButton = (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={saving}
      startIcon={saving ? <CircularProgress size={18} /> : undefined}
    >
      {saving ? "Saving…" : "Save & publish"}
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Storefront"
        title="Store settings"
        description="Text shown across the store. Changes go live as soon as you save."
        actions={
          <Button
            component="a"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            startIcon={<OpenInNew />}
          >
            View store
          </Button>
        }
      />

      <Box
        component="form"
        onSubmit={handleSave}
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
          pb: { xs: 14, lg: 0 },
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {/* Hero */}
          <Card component="section" sx={card}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Home hero
              </Typography>
              <TextField
                id="heroBadge"
                label="Badge"
                value={form.heroBadge}
                onChange={(e) => set("heroBadge", e.target.value)}
                helperText="Small pill above the headline."
                fullWidth
              />
              <Box
                sx={{
                  display: "grid",
                  gap: 2.5,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 200px" },
                }}
              >
                <TextField
                  id="heroTitle"
                  label="Headline"
                  value={form.heroTitle}
                  onChange={(e) => set("heroTitle", e.target.value)}
                  fullWidth
                />
                <TextField
                  id="heroHighlight"
                  label="Highlighted word"
                  value={form.heroHighlight}
                  onChange={(e) => set("heroHighlight", e.target.value)}
                  helperText="In the acid block."
                  fullWidth
                />
              </Box>
              <TextField
                id="heroSubtitle"
                label="Subtitle"
                value={form.heroSubtitle}
                onChange={(e) => set("heroSubtitle", e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          </Card>

          {/* Strips */}
          <Card component="section" sx={card}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Scrolling strips
              </Typography>
              <TextField
                id="announcements"
                label="Top announcement bar"
                value={form.announcements}
                onChange={(e) => set("announcements", e.target.value)}
                helperText="One message per line. Shown above the navbar on every page."
                multiline
                minRows={4}
                fullWidth
                sx={mono}
              />
              <TextField
                id="tickerItems"
                label="Home page ticker"
                value={form.tickerItems}
                onChange={(e) => set("tickerItems", e.target.value)}
                helperText="One message per line. The acid strip between home sections."
                multiline
                minRows={4}
                fullWidth
                sx={mono}
              />
            </Stack>
          </Card>

          {/* Brand */}
          <Card component="section" sx={card}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Brand
              </Typography>
              <TextField
                id="instagramHandle"
                label="Instagram handle"
                value={form.instagramHandle}
                onChange={(e) =>
                  set(
                    "instagramHandle",
                    e.target.value.replace(/^@/, "").replace(/\s/g, ""),
                  )
                }
                helperText={
                  <>
                    Links to{" "}
                    <MuiLink
                      href={instagramUrl(preview.instagramHandle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="inherit"
                    >
                      {instagramUrl(preview.instagramHandle)}
                    </MuiLink>
                  </>
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">@</InputAdornment>
                    ),
                  },
                }}
                fullWidth
              />
              <TextField
                id="facebookUrl"
                label="Facebook page URL"
                type="url"
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value.trim())}
                helperText="Full link starting with https://. Shown in the footer."
                fullWidth
              />
              <TextField
                id="tagline"
                label="Tagline"
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                helperText="Footer text and the default description for search/share previews."
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </Card>

          <Box>
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={() => setForm(toForm(DEFAULT_SETTINGS))}
            >
              Reset to defaults
            </Button>
          </Box>
        </Stack>

        {/* Live preview */}
        <Stack
          component="aside"
          spacing={2}
          sx={{
            position: { lg: "sticky" },
            top: { lg: 24 },
            height: "fit-content",
          }}
        >
          <Typography
            color="text.secondary"
            sx={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Live preview
          </Typography>
          <Box
            sx={{
              overflow: "hidden",
              borderRadius: 3,
              border: "2px solid var(--dc-edge)",
            }}
          >
            <Marquee
              items={preview.announcements}
              tone="inverse"
              border="none"
            />
            <Box className="dc-inverse" sx={{ p: 2.5 }}>
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  borderRadius: 999,
                  border: "2px solid var(--dc-inverse-text)",
                  px: 1.25,
                  py: 0.25,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                }}
              >
                {preview.heroBadge}
              </Box>
              <Typography
                variant="h2"
                component="p"
                sx={{ mt: 1.5, fontSize: 36, lineHeight: 0.95 }}
              >
                {preview.heroTitle}{" "}
                <Box
                  component="span"
                  className="dc-highlight"
                  sx={{ transform: "rotate(-2deg)" }}
                >
                  {preview.heroHighlight}
                </Box>
              </Typography>
              <Typography sx={{ mt: 1.5, fontSize: 12, opacity: 0.8 }}>
                {preview.heroSubtitle}
              </Typography>
            </Box>
            <Marquee items={preview.tickerItems} tone="accent" border="top" />
          </Box>

          <Box sx={{ display: { xs: "none", lg: "block" } }}>
            {submitButton}
          </Box>
        </Stack>

        <Paper
          square
          elevation={0}
          sx={{
            display: { xs: "block", lg: "none" },
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: 20,
            borderTop: "2px solid var(--dc-edge)",
            px: 2,
            pt: 1.5,
            pb: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {submitButton}
        </Paper>
      </Box>
    </>
  );
}
