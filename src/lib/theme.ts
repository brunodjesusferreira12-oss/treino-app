export const THEME_STORAGE_KEY = "fortynex-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveThemePreference(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  return preference;
}

export function getThemeBootstrapScript() {
  return `
    (() => {
      const storageKey = "${THEME_STORAGE_KEY}";
      const saved = window.localStorage.getItem(storageKey);
      const preference =
        saved === "light" || saved === "dark" || saved === "system"
          ? saved
          : "system";
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved =
        preference === "system"
          ? (prefersDark ? "dark" : "light")
          : preference;
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.dataset.themePreference = preference;
      root.style.colorScheme = resolved;

      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.setAttribute(
          "content",
          resolved === "dark" ? "#08090b" : "#f4f7fb",
        );
      }
    })();
  `;
}
