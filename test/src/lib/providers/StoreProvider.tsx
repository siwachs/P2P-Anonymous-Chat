import { type ReactNode } from "react";

import { Provider } from "react-redux";
import { store } from "@/lib/store";

export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <Provider store={store}>{children}</Provider>;
}
