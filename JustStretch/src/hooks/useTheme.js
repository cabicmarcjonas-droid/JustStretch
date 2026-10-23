import { useEffect, useState, useCallback } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("juststretch-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    const meta = document.getElementById("theme-color-meta");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#121412" : "#ffffff");
    localStorage.setItem("juststretch-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setLight = useCallback(() => setTheme("light"), []);
  const setDark = useCallback(() => setTheme("dark"), []);

  return { theme, toggleTheme, setLight, setDark, isDark: theme === "dark" };
}
