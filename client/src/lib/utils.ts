import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { countries } from "@/lib/constants/countries";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCountryViaCode(code: string): {
  flag: string;
  name: string;
} {
  return countries[code];
}
