"use client";

/*
 * Shared DOPAMINE CLUB UI primitives for admin + auth screens, built on MUI.
 * Colours/shape come from app/theme/muiTheme.ts (driven by tokens.ts).
 */

import { useId, type ReactNode } from "react";
import {
  Box,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Skeleton as MuiSkeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Close,
  DarkModeOutlined,
  LightModeOutlined,
} from "@mui/icons-material";

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
    <FormControl fullWidth error={Boolean(error)} className={className}>
      <FormLabel
        htmlFor={htmlFor}
        sx={{ mb: 0.75, fontSize: 14, fontWeight: 700, color: "text.primary" }}
      >
        {label}
        {optional && (
          <Box
            component="span"
            sx={{ ml: 0.5, fontWeight: 500, color: "text.secondary" }}
          >
            (optional)
          </Box>
        )}
      </FormLabel>
      {children}
      {error ? (
        <FormHelperText role="alert" sx={{ mx: 0, fontWeight: 600 }}>
          {error}
        </FormHelperText>
      ) : help ? (
        <FormHelperText sx={{ mx: 0 }}>{help}</FormHelperText>
      ) : null}
    </FormControl>
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
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Box component="label" htmlFor={id} sx={{ cursor: "pointer" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(_, value) => onChange(value)}
      />
    </Stack>
  );
}

/* ---------- Modal: bottom sheet on mobile, dialog on desktop ---------- */
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
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-label={title}
      sx={
        mobile
          ? { "& .MuiDialog-container": { alignItems: "flex-end" } }
          : undefined
      }
      slotProps={{
        paper: {
          sx: {
            m: mobile ? 0 : 2,
            width: mobile ? "100%" : undefined,
            maxHeight: "92vh",
            borderRadius: mobile ? "12px 12px 0 0" : 3,
            border: "2px solid var(--dc-edge)",
            boxShadow: "6px 6px 0 var(--dc-edge)",
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--dc-line)",
          py: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close" edge="end">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "20px !important" }}>{children}</DialogContent>
      {footer && (
        <DialogActions
          sx={{
            flexWrap: "wrap",
            gap: 1.5,
            borderTop: "1px solid var(--dc-line)",
            px: 2.5,
            pt: 2,
            pb: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            "& > :not(style) ~ :not(style)": { ml: 0 },
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
}

/* ---------- Theme switch ---------- */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
      <IconButton
        onClick={toggleTheme}
        className={className}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
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
    <Stack
      direction="row"
      useFlexGap
      spacing={2}
      sx={{
        mb: { xs: 3, md: 4 },
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography
            variant="overline"
            component="p"
            color="text.secondary"
            sx={{ fontSize: 12, mb: 0.5 }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: 30, md: 36 } }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 672 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{ flexWrap: "wrap" }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
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
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        px: 3,
        py: 7,
        textAlign: "center",
        borderStyle: "dashed",
      }}
    >
      <Typography variant="h5" component="p">
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 384 }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Card>
  );
}

/* ---------- Skeleton block (size via className, e.g. "h-12 w-64") ---------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <MuiSkeleton
      variant="rounded"
      animation="pulse"
      className={className}
      sx={{ borderRadius: 2 }}
    />
  );
}
