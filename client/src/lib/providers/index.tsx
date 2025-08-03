import { ReactNode } from "react";

import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        {children}
        <Toaster position="top-center" />
      </StoreProvider>
    </ThemeProvider>
  );
}
