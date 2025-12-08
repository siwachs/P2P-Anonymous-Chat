import { useContext } from "react";
import { P2PContext } from "../P2PContext";

export default function useP2P() {
  const ctx = useContext(P2PContext);

  if (!ctx) throw new Error("useP2P must be used inside <P2PProvider>");
  return ctx;
}
