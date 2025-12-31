import type { CSSProperties } from "react";

const toastStyles = {
  error: {
    style: {
      "--normal-bg":
        "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
      "--normal-text": "var(--color-white)",
      "--normal-border": "transparent",
    } as CSSProperties,
  },

  success: {
    style: {
      "--normal-bg":
        "light-dark(var(--color-green-600), var(--color-green-400))",
      "--normal-text": "var(--color-white)",
      "--normal-border":
        "light-dark(var(--color-green-600), var(--color-green-400))",
    } as CSSProperties,
  },

  warning: {
    style: {
      "--normal-bg":
        "light-dark(var(--color-amber-600), var(--color-amber-400))",
      "--normal-text": "var(--color-white)",
      "--normal-border":
        "light-dark(var(--color-amber-600), var(--color-amber-400))",
    } as CSSProperties,
  },
};

export default toastStyles;
