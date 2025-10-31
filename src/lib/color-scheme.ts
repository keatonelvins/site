const STORAGE_KEY = "theme";

export type ColorScheme = "light" | "dark" | null;

export const setScheme = (scheme: ColorScheme): void => {
  if (scheme) {
    localStorage.setItem(STORAGE_KEY, scheme);
    document.documentElement.classList.toggle("dark", scheme === "dark");
  } else {
    // system
    localStorage.removeItem(STORAGE_KEY);
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  }
};
