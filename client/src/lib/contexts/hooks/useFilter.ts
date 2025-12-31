import { useContext } from "react";
import { FiltersContext } from "../FiltersProvider";

export default function useFilters() {
  const context = useContext(FiltersContext);

  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }

  return context;
}
