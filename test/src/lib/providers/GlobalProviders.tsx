import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";

import { ErrorBoundary } from "@/components/error/ErrorBoundary";

export function GlobalProviders({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
