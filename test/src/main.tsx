import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "./lib/providers";
import AppRouter from "./routes";

import "./main.css";

/**
 * Application Entry Point
 *
 * Provider Hierarchy:
 * StrictMode
 *   └─ AppProviders
 *       └─ GlobalProviders (Theme, ErrorBoundary)
 *           └─ StoreProvider (Redux)
 *               └─ AppRouter (creates Router context)
 *                   └─ RootLayout
 *                       └─ RouterProviders (P2P, etc.)
 *                           └─ Routes (PublicRoute, ProtectedRoute)
 *                               └─ ProtectedRoute
 *                                   └─ ProvidersLayout (FiltersProvider)
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>
);
