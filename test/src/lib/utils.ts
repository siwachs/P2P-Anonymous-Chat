import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { countries } from "@/lib/constants/countries";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCountryViaCode(code: string): {
  flag: string;
  name: string;
} {
  return countries[code];
}

export function isDeepEqual(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  return keys1.every(
    (key) => keys2.includes(key) && valuesEqual(obj1[key], obj2[key]),
  );
}

function valuesEqual(val1: unknown, val2: unknown): boolean {
  if (Array.isArray(val1) && Array.isArray(val2)) {
    return arraysEqual(val1, val2);
  }
  return val1 === val2;
}

function arraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
  return (
    arr1.length === arr2.length &&
    arr1.every((item, index) => item === arr2[index])
  );
}
