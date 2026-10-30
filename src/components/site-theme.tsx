import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import "../site-theme.css";

const key = "yuc-site-theme";
const eventName = "yuc-theme-change";
type Theme = "light" | "dark";
let sessionTheme: Theme | undefined;
function readTheme(): Theme {
  if (sessionTheme) return sessionTheme;
  try {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* The switch also works when browser storage is unavailable. */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function useSiteTheme() {
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.siteTheme = readTheme();
    };
    apply();
    window.addEventListener(eventName, apply);
    window.addEventListener("storage", apply);
    media.addEventListener("change", apply);
    return () => {
      delete document.documentElement.dataset.siteTheme;
      window.removeEventListener(eventName, apply);
      window.removeEventListener("storage", apply);
      media.removeEventListener("change", apply);
    };
  }, []);
}
export function SiteThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(eventName, update);
    window.addEventListener("storage", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener(eventName, update);
      window.removeEventListener("storage", update);
      media.removeEventListener("change", update);
    };
  }, []);
  return (
    <button
      type="button"
      className="yu-theme-toggle"
      aria-label={
        theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
      }
      onClick={() => {
        const next = theme === "light" ? "dark" : "light";
        try {
          localStorage.setItem(key, next);
        } catch {
          sessionTheme = next;
        }
        document.documentElement.dataset.siteTheme = next;
        setTheme(next);
        window.dispatchEvent(new Event(eventName));
      }}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
