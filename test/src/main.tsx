import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "./lib/providers";
import AppRouter from "./routes";

import "./main.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>
);
