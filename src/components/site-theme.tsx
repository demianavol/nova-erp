import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import "../site-theme.css";

const key = "yuc-site-theme";
const eventName = "yuc-theme-change";
type Theme = "light" | "dark";
let sessionTheme: Theme | undefined;
function readTheme(defaultTheme?: Theme): Theme {
  if (sessionTheme) return sessionTheme;
  try {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* The switch also works when browser storage is unavailable. */
  }
  return (
    defaultTheme ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}
export function useSiteTheme(defaultTheme?: Theme) {
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.siteTheme = readTheme(defaultTheme);
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
  }, [defaultTheme]);
}
export function SiteThemeToggle({ defaultTheme }: { defaultTheme?: Theme }) {
  const { t } = useSiteLanguage();
  const [theme, setTheme] = useState(() => readTheme(defaultTheme));
  const activeReveal = useRef<ViewTransition | null>(null);
  useEffect(() => {
    const update = () => setTheme(readTheme(defaultTheme));
    const media = matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(eventName, update);
    window.addEventListener("storage", update);
    media.addEventListener("change", update);
    return () => {
      activeReveal.current?.skipTransition();
      window.removeEventListener(eventName, update);
      window.removeEventListener("storage", update);
      media.removeEventListener("change", update);
    };
  }, [defaultTheme]);
  return (
    <button
      type="button"
      className="yu-theme-toggle"
      aria-label={
        theme === "light" ? t("Включить тёмную тему") : t("Включить светлую тему")
      }
      onClick={(event) => {
        const root = document.documentElement;
        const next = readTheme(defaultTheme) === "light" ? "dark" : "light";
        const apply = () => {
          try {
            localStorage.setItem(key, next);
            sessionTheme = undefined;
          } catch {
            sessionTheme = next;
          }
          root.dataset.siteTheme = next;
          setTheme(next);
          window.dispatchEvent(new Event(eventName));
        };

        activeReveal.current?.skipTransition();
        if (
          !document.startViewTransition ||
          !matchMedia("(prefers-reduced-motion: no-preference)").matches
        ) {
          apply();
          return;
        }

        const { left, top, width, height } =
          event.currentTarget.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const radius = Math.hypot(
          Math.max(x, root.clientWidth - x),
          Math.max(y, root.clientHeight - y),
        );
        root.style.setProperty("--theme-reveal-origin", `${x}px ${y}px`);
        root.style.setProperty("--theme-reveal-radius", `${radius}px`);
        root.dataset.siteThemeReveal = "";
        const transition = document.startViewTransition(() => flushSync(apply));
        activeReveal.current = transition;
        const finish = () => {
          if (activeReveal.current !== transition) return;
          activeReveal.current = null;
          delete root.dataset.siteThemeReveal;
          root.style.removeProperty("--theme-reveal-origin");
          root.style.removeProperty("--theme-reveal-radius");
        };
        void transition.ready.catch(() => {});
        void transition.finished.then(finish, finish);
      }}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
