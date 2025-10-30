import { type ReactNode } from "react";

import { GlobalProviders } from "./GlobalProviders";
import { StoreProvider } from "./StoreProvider";

import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <GlobalProviders>
      <StoreProvider>
        {children}
        <Toaster position="top-center" />x
      </StoreProvider>
    </GlobalProviders>
  );
}

export { RouterProviders } from "./RouterProviders";
export { P2PProvider } from "./P2PProvider";
