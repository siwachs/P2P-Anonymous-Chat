import { createContext } from "react";

type ContextType = { logout: () => void };

export const P2PContext = createContext<ContextType | null>(null);
