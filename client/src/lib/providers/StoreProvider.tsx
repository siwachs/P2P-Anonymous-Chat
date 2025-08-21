"use client";

import { useRef, ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "@/lib/store";

export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  const storeRef = useRef<AppStore>(undefined);
  storeRef.current ??= makeStore();

  return <Provider store={storeRef.current}>{children}</Provider>;
}
