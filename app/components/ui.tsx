"use client";

/*
 * Shared DOPAMINE CLUB UI primitives for admin + auth screens.
 * Styling lives in globals.css (.btn*, .dc-*) so it follows the theme tokens.
 */

import { useEffect, useId, useRef, type ReactNode } from "react";
import { FiMoon, FiSun, FiX } from "react-icons/fi";

import { useThemeMode } from "../providers/ThemeProvider";

/* ---------- Field: label + control + help/error ---------- */
export function Field({
  label,
  htmlFor,
  help,
  error,
  optional,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="dc-label">
        {label}
        {optional && <span className="ml-1 font-medium text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="dc-error" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="dc-help">{help}</p>
      ) : null}
    </div>
  );
}

/* ---------- Toggle switch ---------- */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-bold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors disabled:opacity-50"
        style={{
          borderColor: "var(--dc-edge)",
          background: checked ? "var(--dc-acid)" : "var(--dc-surface-2)",
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full border-2 transition-[left]"
          style={{
            left: checked ? "calc(100% - 1.375rem)" : "0.125rem",
            borderColor: "var(--dc-ink)",
            background: checked ? "var(--dc-ink)" : "var(--dc-surface)",
          }}
        />
      </button>
    </div>
  );
}

/* ---------- Modal (Esc to close, focus trap-lite, scroll lock) ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dc-card-brutal relative flex max-h-[92vh] w-full flex-col rounded-b-none sm:max-w-lg sm:rounded-b-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost px-2" aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div
            className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Theme switch (non-MUI, for admin/auth) ---------- */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-ghost px-2.5 ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
    </button>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="dc-card flex flex-col items-center justify-center gap-3 border-dashed px-6 py-14 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

/* ---------- Skeleton block ---------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />;
}
