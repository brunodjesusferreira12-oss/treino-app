"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import {
  THEME_STORAGE_KEY,
  type ThemePreference,
  isThemePreference,
  resolveThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof SunMedium;
}> = [
  { value: "light", label: "Claro", icon: SunMedium },
  { value: "dark", label: "Escuro", icon: MoonStar },
  { value: "system", label: "Sistema", icon: Monitor },
];

function getStoredPreference() {
  if (typeof window === "undefined") {
    return "system" as ThemePreference;
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(saved) ? saved : "system";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handlePreferenceChange = () => {
    onStoreChange();
  };

  window.addEventListener("fortynex-theme-change", handlePreferenceChange);
  mediaQuery.addEventListener("change", handlePreferenceChange);

  return () => {
    window.removeEventListener("fortynex-theme-change", handlePreferenceChange);
    mediaQuery.removeEventListener("change", handlePreferenceChange);
  };
}

function applyTheme(preference: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveThemePreference(preference, prefersDark);
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
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribe,
    getStoredPreference,
    () => "system" as ThemePreference,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function handleSelect(nextTheme: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event("fortynex-theme-change"));
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card-strong)] p-1 shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
      role="tablist"
      aria-label="Selecionar tema"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={option.label}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--muted)] transition",
              isActive
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
