"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  CategoryOutlined,
  Close,
  DashboardOutlined,
  Inventory2Outlined,
  Logout,
  Menu as MenuIcon,
  OpenInNew,
  TuneOutlined,
} from "@mui/icons-material";

import { auth } from "@/firebase/firebase.config";
import AdminGuard, { useAdminUser } from "@/app/components/AdminGuard";
import BrandLogo from "@/app/components/BrandLogo";
import { ThemeSwitch } from "@/app/components/ui";
import { useThemeMode } from "@/app/providers/ThemeProvider";

const NAV: {
  href: string;
  label: string;
  icon: ReactElement;
  exact?: boolean;
}[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <DashboardOutlined fontSize="small" />,
    exact: true,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: <Inventory2Outlined fontSize="small" />,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: <CategoryOutlined fontSize="small" />,
  },
  {
    href: "/admin/settings",
    label: "Store settings",
    icon: <TuneOutlined fontSize="small" />,
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  // /admin/products, /admin/products/new, /admin/products/[id] …
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItemSx = {
  borderRadius: 2,
  py: 1.25,
  px: 1.5,
  color: "text.secondary",
  "& .MuiListItemIcon-root": { minWidth: 32, color: "inherit" },
  "& .MuiListItemText-primary": { fontSize: 14, fontWeight: 700 },
  "&:hover": { bgcolor: "var(--dc-surface-2)" },
  "&.Mui-selected, &.Mui-selected:hover": {
    bgcolor: "var(--dc-text)",
    color: "var(--dc-bg)",
  },
} as const;

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
    <Stack sx={{ height: "100%" }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          pb: 2.5,
          pt: 3,
        }}
      >
        <MuiLink
          component={Link}
          href="/admin"
          onClick={onNavigate}
          aria-label="Admin dashboard"
          color="inherit"
          underline="none"
        >
          <BrandLogo size="sm" />
        </MuiLink>
        <Chip
          label="Admin"
          size="small"
          color="secondary"
          sx={{ height: 22, borderRadius: 1 }}
        />
      </Stack>

      <Box sx={{ px: 1.5 }}>
        <Button
          component={Link}
          href="/admin/products/new"
          onClick={onNavigate}
          variant="contained"
          fullWidth
          startIcon={<Add />}
        >
          Add product
        </Button>
      </Box>

      <List
        component="nav"
        aria-label="Admin"
        sx={{
          mt: 3,
          flex: 1,
          px: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {NAV.map(({ href, label, icon, exact }) => {
          const active = isActive(pathname, href, exact);

          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              onClick={onNavigate}
              selected={active}
              aria-current={active ? "page" : undefined}
              sx={navItemSx}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );
        })}

        <ListItemButton
          component="a"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          sx={navItemSx}
        >
          <ListItemIcon>
            <OpenInNew fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View store" />
        </ListItemButton>
      </List>

      <Box sx={{ borderTop: "1px solid var(--dc-line)", p: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 900,
              textTransform: "uppercase",
              bgcolor: "var(--dc-acid)",
              color: "var(--dc-ink)",
              border: "2px solid var(--dc-edge)",
            }}
          >
            {(user?.email ?? "A").charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>
              {user?.email}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 11 }}>
              Store admin
            </Typography>
          </Box>
          <ThemeSwitch />
        </Stack>
        <Button
          variant="text"
          fullWidth
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            mt: 1,
            justifyContent: "flex-start",
            color: "text.secondary",
            textTransform: "none",
            letterSpacing: 0,
          }}
        >
          Log out
        </Button>
      </Box>
    </Stack>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "var(--dc-bg)",
        color: "var(--dc-text)",
      }}
    >
      {/* Desktop sidebar */}
      <Box
        component="aside"
        sx={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: 256,
          display: { xs: "none", lg: "block" },
          borderRight: "1px solid var(--dc-line)",
          bgcolor: "var(--dc-surface)",
        }}
      >
        <Sidebar />
      </Box>

      {/* Mobile top bar */}
      <Stack
        component="header"
        direction="row"
        sx={{
          position: "sticky",
          top: "env(safe-area-inset-top, 0px)",
          zIndex: 30,
          display: { lg: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--dc-line)",
          bgcolor: "var(--dc-surface)",
          px: 2,
          py: 1.5,
        }}
      >
        <IconButton
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <MenuIcon />
        </IconButton>
        <MuiLink
          component={Link}
          href="/admin"
          aria-label="Admin dashboard"
          color="inherit"
          underline="none"
        >
          <BrandLogo size="sm" />
        </MuiLink>
        <ThemeSwitch />
      </Stack>

      {/* Mobile drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { lg: "none" } }}
        slotProps={{
          paper: {
            sx: { width: 288, maxWidth: "85vw", bgcolor: "var(--dc-surface)" },
          },
        }}
      >
        <IconButton
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
        >
          <Close />
        </IconButton>
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <Box component="main" sx={{ pl: { lg: "256px" } }}>
        <Box
          sx={{
            mx: "auto",
            width: "100%",
            maxWidth: 1152,
            px: { xs: 2, sm: 3, lg: 5 },
            py: { xs: 3, md: 5 },
          }}
        >
          {children}
        </Box>
      </Box>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        theme={mode === "dark" ? "dark" : "light"}
      />
    </Box>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <Shell>{children}</Shell>
    </AdminGuard>
  );
}
