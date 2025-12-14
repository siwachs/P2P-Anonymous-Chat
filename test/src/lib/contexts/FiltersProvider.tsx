import {
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  createContext,
  useState,
  useMemo,
} from "react";
import { useAppSelector } from "@/lib/hooks";

import type { OnlineUser } from "@/types";

type GenderFilter = OnlineUser["gender"] | "all";

interface FiltersContextValue {
  // state
  searchQuery: string;
  genderFilter: GenderFilter;
  countryFilter: string;

  // setters
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setGenderFilter: Dispatch<SetStateAction<GenderFilter>>;
  setCountryFilter: Dispatch<SetStateAction<string>>;

  // derived data
  onlineUsers: OnlineUser[];
  filteredUsers: OnlineUser[];
  availableCountries: string[];
  hasActiveFilters: boolean;

  // actions
  clearFilters: () => void;
}

export const FiltersContext = createContext<FiltersContextValue | null>(null);

export default function FiltersProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    OnlineUser["gender"] | "all"
  >("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const { currentUser } = useAppSelector((state) => state.user);
  const { users } = useAppSelector((state) => state.onlineUsers);
  const onlineUsers = useMemo(() => Object.values(users), [users]);

  const filteredUsers = useMemo(() => {
    return onlineUsers.filter((user) => {
      if (user.username === currentUser?.username) return false;

      // Search filter
      if (
        searchQuery &&
        !user.username.toLowerCase().includes(searchQuery.toLocaleLowerCase())
      )
        return false;

      // Gender Filter
      if (genderFilter !== "all" && user.gender !== genderFilter) return false;

      // Country Filter
      if (countryFilter !== "all" && user.country !== countryFilter)
        return false;

      return true;
    });
  }, [
    searchQuery,
    onlineUsers,
    currentUser?.username,
    genderFilter,
    countryFilter,
  ]);

  const availableCountries = useMemo(() => {
    const countryCodes = new Set(onlineUsers.map((user) => user.country));

    return Array.from(countryCodes).sort((a, b) => a.localeCompare(b));
  }, [onlineUsers]);

  const hasActiveFilters =
    genderFilter !== "all" || countryFilter !== "all" || searchQuery.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setCountryFilter("all");
  };

  const value: FiltersContextValue = {
    searchQuery,
    genderFilter,
    countryFilter,

    setSearchQuery,
    setGenderFilter,
    setCountryFilter,

    onlineUsers,
    filteredUsers,
    availableCountries,
    hasActiveFilters,

    clearFilters,
  };

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}
