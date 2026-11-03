"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiExternalLink,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiPlus,
  FiSliders,
  FiX,
} from "react-icons/fi";

import { auth } from "@/firebase/firebase.config";
import AdminGuard, { useAdminUser } from "@/app/components/AdminGuard";
import BrandLogo from "@/app/components/BrandLogo";
import { ThemeSwitch } from "@/app/components/ui";
import { useThemeMode } from "@/app/providers/ThemeProvider";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiGrid, exact: true },
  { href: "/admin/products", label: "Products", icon: FiPackage },
  { href: "/admin/categories", label: "Categories", icon: FiLayers },
  { href: "/admin/settings", label: "Store settings", icon: FiSliders },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  // /admin/products, /admin/products/new, /admin/products/[id] …
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const user = useAdminUser();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("auth");
    router.replace("/auth/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Link href="/admin" onClick={onNavigate} aria-label="Admin dashboard">
          <BrandLogo size="sm" />
        </Link>
        <span className="dc-badge dc-badge-ink">Admin</span>
      </div>

      <div className="px-3">
        <Link
          href="/admin/products/new"
          onClick={onNavigate}
          className="btn-brutal btn-primary btn-sm w-full"
        >
          <FiPlus /> Add product
        </Link>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                active ? "" : "text-muted hover:bg-surface-2"
              }`}
              style={
                active
                  ? {
                      background: "var(--dc-text)",
                      color: "var(--dc-bg)",
                    }
                  : undefined
              }
            >
              <Icon className="text-base" />
              {label}
            </Link>
          );
        })}

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted transition-colors hover:bg-surface-2"
        >
          <FiExternalLink className="text-base" />
          View store
        </a>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black uppercase"
            style={{ background: "var(--dc-acid)", color: "var(--dc-ink)", border: "2px solid var(--dc-edge)" }}
            aria-hidden
          >
            {(user?.email ?? "A").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{user?.email}</p>
            <p className="text-[11px] text-muted">Store admin</p>
          </div>
          <ThemeSwitch />
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-ghost mt-2 w-full justify-start text-muted">
          <FiLogOut /> Log out
        </button>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-screen" style={{ background: "var(--dc-bg)", color: "var(--dc-text)" }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header
        className="sticky z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="btn btn-ghost px-2"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <FiMenu className="text-xl" />
        </button>
        <Link href="/admin" aria-label="Admin dashboard">
          <BrandLogo size="sm" />
        </Link>
        <ThemeSwitch />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r-2 bg-surface" style={{ borderColor: "var(--dc-edge)" }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn btn-ghost absolute right-2 top-2 z-10 px-2"
              aria-label="Close menu"
            >
              <FiX className="text-lg" />
            </button>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-10">{children}</div>
      </main>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        theme={mode === "dark" ? "dark" : "light"}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <Shell>{children}</Shell>
    </AdminGuard>
  );
}
