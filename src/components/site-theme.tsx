import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
  const activeReveal = useRef<ViewTransition | null>(null);
  useEffect(() => {
    const update = () => setTheme(readTheme());
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
  }, []);
  return (
    <button
      type="button"
      className="yu-theme-toggle"
      aria-label={
        theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
      }
      onClick={(event) => {
        const root = document.documentElement;
        const next = readTheme() === "light" ? "dark" : "light";
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
