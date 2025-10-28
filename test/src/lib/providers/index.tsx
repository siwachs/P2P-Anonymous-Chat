import { ThemeProvider } from "./ThemeProvider";
import { StoreProvider } from "./StoreProvider";
import { Toaster } from "@/components/ui/sonner";

import type { ReactNode } from "react";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StoreProvider>
        {children}
        <Toaster position="top-center" />
      </StoreProvider>
    </ThemeProvider>
  );
}
