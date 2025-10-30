import { type ReactNode } from "react";
import { P2PProvider } from "./P2PProvider";

export function RouterProviders({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <P2PProvider>{children}</P2PProvider>;
}
