import { ReactNode } from "react";

import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { P2PProvider } from "./P2PProvider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        <AuthProvider>
          <P2PProvider>
            {children}
            <Toaster position="top-center" />
          </P2PProvider>
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
