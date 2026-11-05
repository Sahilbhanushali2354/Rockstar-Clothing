"use client";

import { IconButton, InputBase, Paper } from "@mui/material";
import { Search } from "@mui/icons-material";

const SearchBar = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        p: 0.5,
        pl: 1,
        borderRadius: 999,
        bgcolor: "var(--dc-surface-2)",
      }}
    >
      <IconButton size="small" aria-label="Search" sx={{ opacity: 0.5 }}>
        <Search fontSize="small" />
      </IconButton>
      <InputBase
        placeholder="Search"
        autoComplete="off"
        sx={{ ml: 1, fontSize: 15 }}
      />
    </Paper>
  );
};

export default SearchBar;
