"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Link as MuiLink,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Close,
  DashboardOutlined,
  FavoriteBorder,
  KeyboardArrowDown,
  Logout,
  Menu as MenuIcon,
  PersonOutlined,
  Search,
  ShoppingBagOutlined,
  WhatsApp,
} from "@mui/icons-material";

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

const avatarSx = (size: number) => ({
  width: size,
  height: size,
  fontSize: size * 0.45,
  fontWeight: 900,
  bgcolor: "var(--dc-acid)",
  color: "var(--dc-ink)",
  border: "2px solid var(--dc-ink)",
});

const dropdownPaper = {
  sx: { mt: 1.5, p: 1, borderRadius: 3, "& .MuiMenu-list": { p: 0 } },
};

const menuItemSx = {
  borderRadius: 2,
  py: 1.25,
  fontSize: 14,
  fontWeight: 700,
} as const;

/* Account button: login link when signed out, avatar + dropdown when signed in. */
function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user, name, isAdmin } = useAuthUser();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => setAnchor(null), [pathname]);

  if (!ready || !user) {
    return (
      <IconLink
        href={`/auth/login?redirect=${encodeURIComponent(pathname || "/")}`}
        label="Log in"
      >
        <PersonOutlined />
      </IconLink>
    );
  }

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    router.refresh();
  };

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-expanded={Boolean(anchor)}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <Avatar sx={avatarSx(32)}>{initialOf(name, user.email)}</Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { ...dropdownPaper.sx, width: 240 } } }}
      >
        <Box sx={{ px: 1.5, pb: 1.25, pt: 0.75 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 800 }}>
            {name || "Hey there"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block" }}
          >
            {user.email}
          </Typography>
        </Box>
        <Divider sx={{ mb: 0.5 }} />
        <MenuItem component={Link} href="/profile" sx={menuItemSx}>
          <ListItemIcon>
            <PersonOutlined fontSize="small" />
          </ListItemIcon>
          My account
        </MenuItem>
        <MenuItem component={Link} href="/wishlist" sx={menuItemSx}>
          <ListItemIcon>
            <FavoriteBorder fontSize="small" />
          </ListItemIcon>
          Wishlist
        </MenuItem>
        {isAdmin && (
          <MenuItem component={Link} href="/admin" sx={menuItemSx}>
            <ListItemIcon>
              <DashboardOutlined fontSize="small" />
            </ListItemIcon>
            Admin dashboard
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={handleLogout}
          sx={{
            ...menuItemSx,
            color: "text.secondary",
            "&:hover": { color: "error.main" },
          }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}

function IconLink({
  href,
  label,
  children,
  count = 0,
}: {
  href: string;
  label: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <IconButton
      component={Link}
      href={href}
      aria-label={count ? `${label} (${count})` : label}
    >
      <Badge badgeContent={count > 99 ? "99+" : count} invisible={count <= 0}>
        {children}
      </Badge>
    </IconButton>
  );
}

export default function Navbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { categories } = useCategories();
  const settings = useStoreSettings();
  const authUser = useAuthUser();

  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shopAnchor, setShopAnchor] = useState<HTMLElement | null>(null);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    router.refresh();
  };

  // Close menus on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setShopAnchor(null);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinkSx = (active: boolean) => ({
    position: "relative",
    minHeight: 0,
    px: 0.5,
    py: 1,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "0.025em",
    color: active ? "text.primary" : "text.secondary",
    "&:hover": { bgcolor: "transparent", color: "text.primary" },
    "&::after": {
      content: '""',
      position: "absolute",
      insetInline: 4,
      bottom: -2,
      height: 3,
      borderRadius: 999,
      bgcolor: "var(--dc-acid)",
      transform: active ? "scaleX(1)" : "scaleX(0)",
      transition: "transform 150ms",
    },
    "&:hover::after": { transform: "scaleX(1)" },
  });

  const whatsappHref = buildWhatsAppUrl(
    `Hey ${STORE.name}! 👋 I have a question.`,
  );

  return (
    <>
      <Marquee items={settings.announcements} tone="inverse" border="none" />

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: "env(safe-area-inset-top, 0px)",
          zIndex: 40,
          borderBottom: "2px solid var(--dc-edge)",
          bgcolor: "var(--dc-bg)",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mx: "auto",
            maxWidth: 1280,
            height: { xs: 64, lg: 72 },
            alignItems: "center",
            px: { xs: 1.5, sm: 3, lg: 4 },
          }}
        >
          {/* Mobile: menu */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            sx={{ display: { lg: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <MuiLink
            component={Link}
            href="/"
            aria-label="DOPAMINE CLUB home"
            color="inherit"
            underline="none"
            sx={{
              flexShrink: 0,
              mx: { xs: "auto !important", lg: "0 !important" },
              mr: { lg: "32px !important" },
            }}
          >
            <BrandLogo size="md" />
          </MuiLink>

          {/* Desktop nav */}
          <Stack
            component="nav"
            aria-label="Main"
            direction="row"
            spacing={3}
            sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}
          >
            <Button
              component={Link}
              href="/"
              variant="text"
              sx={navLinkSx(isActive("/"))}
            >
              Home
            </Button>

            <Button
              variant="text"
              onClick={(event) => setShopAnchor(event.currentTarget)}
              aria-expanded={Boolean(shopAnchor)}
              aria-haspopup="true"
              endIcon={
                <KeyboardArrowDown
                  sx={{
                    transition: "transform 150ms",
                    transform: shopAnchor ? "rotate(180deg)" : "none",
                  }}
                />
              }
              sx={navLinkSx(
                isActive("/shop") || pathname.startsWith("/category"),
              )}
            >
              Shop
            </Button>

            <Menu
              anchorEl={shopAnchor}
              open={Boolean(shopAnchor)}
              onClose={() => setShopAnchor(null)}
              slotProps={{ paper: { sx: { ...dropdownPaper.sx, width: 256 } } }}
            >
              <MenuItem
                component={Link}
                href="/shop"
                sx={{
                  ...menuItemSx,
                  justifyContent: "space-between",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  "&:hover": {
                    bgcolor: "var(--dc-acid)",
                    color: "var(--dc-ink)",
                  },
                }}
              >
                Shop all{" "}
                <Box component="span" aria-hidden>
                  →
                </Box>
              </MenuItem>
              {categories.length > 0 && <Divider sx={{ my: 0.5 }} />}
              {categories.map((category) => (
                <MenuItem
                  key={category.id}
                  component={Link}
                  href={`/category/${category.slug}`}
                  sx={{ ...menuItemSx, py: 1 }}
                >
                  {category.name}
                </MenuItem>
              ))}
            </Menu>

            {categories.slice(0, 3).map((category) => (
              <Button
                key={category.id}
                component={Link}
                href={`/category/${category.slug}`}
                variant="text"
                sx={navLinkSx(isActive(`/category/${category.slug}`))}
              >
                {category.name}
              </Button>
            ))}
          </Stack>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={0.25}
            sx={{ alignItems: "center", ml: { lg: "auto !important" } }}
          >
            <Box sx={{ display: { xs: "none", sm: "flex" } }}>
              <IconLink href="/shop" label="Search products">
                <Search />
              </IconLink>
              <IconLink href="/wishlist" label="Wishlist" count={wishlistCount}>
                <FavoriteBorder />
              </IconLink>
              <AccountMenu />
            </Box>
            <Box sx={{ display: { xs: "none", lg: "flex" } }}>
              <ThemeSwitch />
            </Box>
            <IconLink href="/cart" label="Cart" count={cartCount}>
              <ShoppingBagOutlined />
            </IconLink>
          </Stack>
        </Stack>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { lg: "none" } }}
        slotProps={{
          paper: { sx: { width: "86vw", maxWidth: 384 }, "aria-label": "Menu" },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid var(--dc-edge)",
            px: 2,
            py: 1.5,
          }}
        >
          <BrandLogo size="sm" />
          <IconButton
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <Close />
          </IconButton>
        </Stack>

        <Box
          component="nav"
          aria-label="Mobile"
          sx={{ flex: 1, overflowY: "auto", px: 2, py: 2.5 }}
        >
          {[
            { href: "/", label: "Home" },
            { href: "/shop", label: "Shop all" },
          ].map((item) => (
            <MuiLink
              key={item.href}
              component={Link}
              href={item.href}
              color="inherit"
              underline="none"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--dc-line)",
                py: 1.5,
                fontFamily: "var(--font-display), var(--font-body), sans-serif",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {item.label}
              {isActive(item.href) && (
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid var(--dc-ink)",
                    bgcolor: "var(--dc-acid)",
                  }}
                />
              )}
            </MuiLink>
          ))}

          {categories.length > 0 && (
            <>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 1,
                  mt: 3,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                }}
              >
                Collections
              </Typography>
              <Stack
                direction="row"
                useFlexGap
                spacing={1}
                sx={{ flexWrap: "wrap" }}
              >
                {categories.map((category) => {
                  const active = isActive(`/category/${category.slug}`);
                  return (
                    <Chip
                      key={category.id}
                      component={Link}
                      href={`/category/${category.slug}`}
                      clickable
                      label={category.name}
                      sx={{
                        borderRadius: 999,
                        border: "2px solid var(--dc-edge)",
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: "none",
                        letterSpacing: 0,
                        bgcolor: active ? "var(--dc-acid)" : "transparent",
                        color: active ? "var(--dc-ink)" : "inherit",
                      }}
                    />
                  );
                })}
              </Stack>
            </>
          )}

          {/* Account */}
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 3,
              border: "2px solid var(--dc-edge)",
            }}
          >
            {authUser.user ? (
              <>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Avatar sx={avatarSx(40)}>
                    {initialOf(authUser.name, authUser.user.email)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 800 }}>
                      {authUser.name || "Hey there"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      {authUser.user.email}
                    </Typography>
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  useFlexGap
                  spacing={1}
                  sx={{ mt: 1.5, flexWrap: "wrap" }}
                >
                  {authUser.isAdmin && (
                    <Button
                      component={Link}
                      href="/admin"
                      variant="outlined"
                      startIcon={<DashboardOutlined />}
                      sx={{ flex: 1 }}
                    >
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                    sx={{ flex: 1, color: "error.main" }}
                  >
                    Log out
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  component={Link}
                  href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                  variant="contained"
                  color="secondary"
                  sx={{ flex: 1 }}
                >
                  Log in
                </Button>
                <Button
                  component={Link}
                  href={`/auth/signup?redirect=${encodeURIComponent(pathname)}`}
                  variant="contained"
                  sx={{ flex: 1 }}
                >
                  Sign up
                </Button>
              </Stack>
            )}
          </Paper>

          <Box
            sx={{
              mt: 1.5,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
            }}
          >
            {[
              {
                href: "/wishlist",
                label: "Wishlist",
                icon: <FavoriteBorder />,
                count: wishlistCount,
              },
              {
                href: "/cart",
                label: "Cart",
                icon: <ShoppingBagOutlined />,
                count: cartCount,
              },
              {
                href: "/profile",
                label: "Account",
                icon: <PersonOutlined />,
                count: 0,
              },
            ].map(({ href, label, icon, count }) => (
              <Button
                key={href}
                component={Link}
                href={href}
                variant="text"
                sx={{
                  flexDirection: "column",
                  gap: 0.5,
                  py: 1.5,
                  borderRadius: 3,
                  border: "2px solid var(--dc-line)",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                <Badge badgeContent={count} invisible={count <= 0}>
                  {icon}
                </Badge>
                {label}
              </Button>
            ))}
          </Box>
        </Box>

        <Stack
          spacing={1.5}
          sx={{
            borderTop: "2px solid var(--dc-edge)",
            px: 2,
            pt: 2,
            pb: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <Button
            component="a"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<WhatsApp />}
          >
            Chat with us
          </Button>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <MuiLink
              href={instagramUrl(settings.instagramHandle)}
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: 14, fontWeight: 700 }}
            >
              @{settings.instagramHandle}
            </MuiLink>
            <ThemeSwitch />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
