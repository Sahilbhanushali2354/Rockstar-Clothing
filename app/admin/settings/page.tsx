"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FiExternalLink, FiRotateCcw } from "react-icons/fi";

import { FStore } from "@/firebase/firebase.config";
import { Field, PageHeader, Skeleton } from "@/app/components/ui";
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Storefront"
        title="Store settings"
        description="Text shown across the store. Changes go live as soon as you save."
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn">
            <FiExternalLink /> View store
          </a>
        }
      />

      <form onSubmit={handleSave} className="grid gap-6 pb-28 lg:grid-cols-[1fr_360px] lg:pb-0">
        <div className="min-w-0 space-y-6">
          {/* Hero */}
          <section className="dc-card space-y-4 p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold">Home hero</h2>
            <Field label="Badge" htmlFor="heroBadge" help="Small pill above the headline.">
              <input id="heroBadge" value={form.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} className="dc-input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Field label="Headline" htmlFor="heroTitle">
                <input id="heroTitle" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} className="dc-input" />
              </Field>
              <Field label="Highlighted word" htmlFor="heroHighlight" help="In the acid block.">
                <input id="heroHighlight" value={form.heroHighlight} onChange={(e) => set("heroHighlight", e.target.value)} className="dc-input" />
              </Field>
            </div>
            <Field label="Subtitle" htmlFor="heroSubtitle">
              <textarea id="heroSubtitle" rows={3} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} className="dc-input resize-y" />
            </Field>
          </section>

          {/* Strips */}
          <section className="dc-card space-y-4 p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold">Scrolling strips</h2>
            <Field label="Top announcement bar" htmlFor="announcements" help="One message per line. Shown above the navbar on every page.">
              <textarea id="announcements" rows={4} value={form.announcements} onChange={(e) => set("announcements", e.target.value)} className="dc-input resize-y font-mono text-xs" />
            </Field>
            <Field label="Home page ticker" htmlFor="tickerItems" help="One message per line. The acid strip between home sections.">
              <textarea id="tickerItems" rows={4} value={form.tickerItems} onChange={(e) => set("tickerItems", e.target.value)} className="dc-input resize-y font-mono text-xs" />
            </Field>
          </section>

          {/* Brand */}
          <section className="dc-card space-y-4 p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold">Brand</h2>
            <Field
              label="Instagram handle"
              htmlFor="instagramHandle"
              help={
                <>
                  Links to{" "}
                  <a href={instagramUrl(preview.instagramHandle)} target="_blank" rel="noopener noreferrer" className="underline">
                    {instagramUrl(preview.instagramHandle)}
                  </a>
                </>
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted">@</span>
                <input
                  id="instagramHandle"
                  value={form.instagramHandle}
                  onChange={(e) => set("instagramHandle", e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                  className="dc-input pl-8"
                />
              </div>
            </Field>
            <Field label="Facebook page URL" htmlFor="facebookUrl" help="Full link starting with https://. Shown in the footer.">
              <input
                id="facebookUrl"
                type="url"
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value.trim())}
                className="dc-input"
              />
            </Field>
            <Field label="Tagline" htmlFor="tagline" help="Footer text and the default description for search/share previews.">
              <textarea id="tagline" rows={2} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="dc-input resize-y" />
            </Field>
          </section>

          <button type="button" onClick={() => setForm(toForm(DEFAULT_SETTINGS))} className="btn">
            <FiRotateCcw /> Reset to defaults
          </button>
        </div>

        {/* Live preview */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Live preview</p>
          <div className="overflow-hidden rounded-xl border-2 border-edge">
            <Marquee items={preview.announcements} tone="inverse" className="border-y-0" />
            <div className="dc-inverse p-5">
              <span className="inline-block rounded-full border-2 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ borderColor: "var(--dc-inverse-text)" }}>
                {preview.heroBadge}
              </span>
              <p className="mt-3 font-display text-4xl font-bold leading-[0.95] tracking-tight">
                {preview.heroTitle} <span className="dc-highlight -rotate-2">{preview.heroHighlight}</span>
              </p>
              <p className="mt-3 text-xs opacity-80">{preview.heroSubtitle}</p>
            </div>
            <Marquee items={preview.tickerItems} tone="accent" className="border-b-0" />
          </div>

          <button type="submit" disabled={saving} className="btn-brutal btn-primary hidden w-full lg:flex">
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </aside>

        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-edge bg-surface px-4 pt-3 lg:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button type="submit" disabled={saving} className="btn-brutal btn-primary w-full">
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </form>
    </>
  );
}
