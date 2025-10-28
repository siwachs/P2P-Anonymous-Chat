import { Provider } from "react-redux";
import { store } from "@/lib/store";

import type { ReactNode } from "react";

export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <Provider store={store}>{children}</Provider>;
}
