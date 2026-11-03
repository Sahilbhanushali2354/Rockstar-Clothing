"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import BrandLogo from "./BrandLogo";
import { ThemeSwitch } from "./ui";
import Marquee from "./store/Marquee";
import { useAppSelector } from "../lib/hooks";
import { useCategories } from "../lib/useCategories";
import { useStoreSettings } from "../lib/useStoreSettings";
import { logout, useAuthUser } from "../lib/useAuthUser";
import { instagramUrl } from "../lib/storeSettings";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { STORE } from "../theme/tokens";

const initialOf = (name: string, email?: string | null) =>
  (name || email || "?").trim().charAt(0).toUpperCase();

/* Account button: login link when signed out, avatar + dropdown when signed in. */
function AccountMenu({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user, name, isAdmin } = useAuthUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || !user) {
    return (
      <IconLink href={`/auth/login?redirect=${encodeURIComponent(pathname || "/")}`} label="Log in" className={className}>
        <FiUser className="text-lg" />
      </IconLink>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.refresh();
  };

  const item = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-surface-2";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-acid text-sm font-black text-ink">
          {initialOf(name, user.email)}
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border-2 border-edge bg-surface p-2 shadow-brutal">
          <div className="border-b border-line px-3 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-extrabold">{name || "Hey there"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="py-1">
            <Link href="/profile" role="menuitem" className={item}>
              <FiUser /> My account
            </Link>
            <Link href="/wishlist" role="menuitem" className={item}>
              <FiHeart /> Wishlist
            </Link>
            {isAdmin && (
              <Link href="/admin" role="menuitem" className={item}>
                <FiGrid /> Admin dashboard
              </Link>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={`${item} w-full border-t border-line text-muted hover:text-danger`}
          >
            <FiLogOut /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* Count badge on header icons (acid on ink edge). */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-acid px-1 text-[10px] font-black leading-none text-ink"
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
  count = 0,
  className = "",
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label} (${count})` : label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-surface-2 ${className}`}
    >
      {children}
      <CountBadge count={count} />
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { categories } = useCategories();
  const settings = useStoreSettings();
  const authUser = useAuthUser();

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    router.refresh();
  };

  const cartCount = useAppSelector((state) => state.cart.items.reduce((total, item) => total + item.quantity, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setShopOpen(false);
  }, [pathname]);

  // Lock scroll while the drawer is open; Esc closes menus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setShopOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Click outside closes the desktop dropdown.
  useEffect(() => {
    if (!shopOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!shopRef.current?.contains(event.target as Node)) setShopOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [shopOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const navLink = (href: string) =>
    `relative px-1 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors after:absolute after:inset-x-1 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-acid after:transition-transform ${
      isActive(href) ? "after:scale-x-100" : "text-muted hover:text-fg after:scale-x-0 hover:after:scale-x-100"
    }`;

  const whatsappHref = buildWhatsAppUrl(`Hey ${STORE.name}! 👋 I have a question.`);

  return (
    <>
      <Marquee items={settings.announcements} tone="inverse" className="border-y-0" />

      <header
        className="sticky z-40 border-b-2 border-edge bg-bg"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:h-[72px] lg:px-8">
          {/* Mobile: menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2 lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <FiMenu className="text-xl" />
          </button>

          <Link href="/" aria-label="DOPAMINE CLUB home" className="mx-auto shrink-0 lg:mx-0 lg:mr-8">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            <Link href="/" className={navLink("/")}>
              Home
            </Link>

            <div className="relative" ref={shopRef}>
              <button
                type="button"
                onClick={() => setShopOpen((open) => !open)}
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className={`${navLink("/shop")} inline-flex items-center gap-1 ${
                  pathname.startsWith("/category") ? "!text-fg after:!scale-x-100" : ""
                }`}
              >
                Shop <FiChevronDown className={`transition-transform ${shopOpen ? "rotate-180" : ""}`} />
              </button>

              {shopOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-xl border-2 border-edge bg-surface p-2 shadow-brutal">
                  <Link href="/shop" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-extrabold uppercase hover:bg-acid hover:text-ink">
                    Shop all <span aria-hidden>→</span>
                  </Link>
                  {categories.length > 0 && <div className="my-1 border-t border-line" />}
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-surface-2"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {categories.slice(0, 3).map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className={navLink(`/category/${category.slug}`)}>
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 lg:ml-auto">
            <IconLink href="/shop" label="Search products" className="hidden sm:flex">
              <FiSearch className="text-lg" />
            </IconLink>
            <IconLink href="/wishlist" label="Wishlist" count={wishlistCount} className="hidden sm:flex">
              <FiHeart className="text-lg" />
            </IconLink>
            <AccountMenu className="hidden sm:flex" />
            <ThemeSwitch className="hidden lg:inline-flex" />
            <IconLink href="/cart" label="Cart" count={cartCount}>
              <FiShoppingBag className="text-lg" />
            </IconLink>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col border-r-2 border-edge bg-bg">
            <div className="flex items-center justify-between border-b-2 border-edge px-4 py-3">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"
                aria-label="Close menu"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile">
              {[
                { href: "/", label: "Home" },
                { href: "/shop", label: "Shop all" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between border-b border-line py-3 font-display text-3xl font-bold"
                >
                  {item.label}
                  {isActive(item.href) && <span className="h-3 w-3 rounded-full border-2 border-ink bg-acid" aria-hidden />}
                </Link>
              ))}

              {categories.length > 0 && (
                <>
                  <p className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Collections</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className={`rounded-full border-2 border-edge px-3.5 py-1.5 text-sm font-bold ${
                          isActive(`/category/${category.slug}`) ? "bg-acid text-ink" : ""
                        }`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* Account */}
              <div className="mt-6 rounded-xl border-2 border-edge p-3">
                {authUser.user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-acid font-black text-ink">
                        {initialOf(authUser.name, authUser.user.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold">{authUser.name || "Hey there"}</p>
                        <p className="truncate text-xs text-muted">{authUser.user.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {authUser.isAdmin && (
                        <Link href="/admin" className="btn flex-1">
                          <FiGrid /> Admin
                        </Link>
                      )}
                      <button type="button" onClick={handleLogout} className="btn btn-danger-soft flex-1">
                        <FiLogOut /> Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`} className="btn-brutal btn-ink btn-sm flex-1">
                      Log in
                    </Link>
                    <Link href={`/auth/signup?redirect=${encodeURIComponent(pathname)}`} className="btn-brutal btn-primary btn-sm flex-1">
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { href: "/wishlist", label: "Wishlist", icon: FiHeart, count: wishlistCount },
                  { href: "/cart", label: "Cart", icon: FiShoppingBag, count: cartCount },
                  { href: "/profile", label: "Account", icon: FiUser, count: 0 },
                ].map(({ href, label, icon: Icon, count }) => (
                  <Link
                    key={href}
                    href={href}
                    className="relative flex flex-col items-center gap-1 rounded-xl border-2 border-line py-3 text-xs font-bold"
                  >
                    <Icon className="text-lg" />
                    {label}
                    {count > 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-acid px-1.5 text-[10px] font-black text-ink">
                        {count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            <div
              className="space-y-3 border-t-2 border-edge px-4 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-brutal btn-primary w-full">
                <FaWhatsapp className="text-lg" /> Chat with us
              </a>
              <div className="flex items-center justify-between text-sm font-bold text-muted">
                <a href={instagramUrl(settings.instagramHandle)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  @{settings.instagramHandle}
                </a>
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
