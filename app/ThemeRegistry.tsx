"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import theme from "./theme";
import { SoundProvider } from "./contexts/SoundContext";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SoundProvider>
          {children}
        </SoundProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
