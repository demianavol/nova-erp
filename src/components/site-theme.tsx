import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import "../site-theme.css";

const key = "yuc-site-theme";
const eventName = "yuc-theme-change";
type Theme = "light" | "dark";
type SitePage = "landing" | "login";
let sessionTheme: Theme | undefined;
function readTheme(): Theme {
  if (sessionTheme) return sessionTheme;
  try {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* The switch also works when browser storage is unavailable. */
  }
  return "dark";
}
export function useSiteTheme(page: SitePage | null) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );

    if (!page) {
      delete root.dataset.sitePage;
      delete root.dataset.siteTheme;
      if (themeColor) themeColor.content = "#f5f6fa";
      return;
    }

    const apply = () => {
      root.dataset.sitePage = page;
      root.dataset.siteTheme = readTheme();
      if (themeColor) {
        themeColor.content = getComputedStyle(root)
          .getPropertyValue("--yu-site-surface")
          .trim();
      }
    };
    apply();
    window.addEventListener(eventName, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(eventName, apply);
      window.removeEventListener("storage", apply);
    };
  }, [page]);
}
export function SiteThemeToggle({ inMenu = false }: { inMenu?: boolean }) {
  const { t } = useSiteLanguage();
  const [theme, setTheme] = useState(readTheme);
  const activeReveal = useRef<ViewTransition | null>(null);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    window.addEventListener(eventName, update);
    window.addEventListener("storage", update);
    return () => {
      activeReveal.current?.skipTransition();
      window.removeEventListener(eventName, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const label =
    theme === "light" ? t("Включить тёмную тему") : t("Включить светлую тему");
  const icon = theme === "light" ? <Moon size={18} /> : <Sun size={18} />;
  const toggle = (anchor: HTMLElement) => {
    const root = document.documentElement;
    const next = readTheme() === "light" ? "dark" : "light";
    const apply = () => {
      try {
        localStorage.setItem(key, next);
        sessionTheme = undefined;
      } catch {
        sessionTheme = next;
      }
      window.dispatchEvent(new Event(eventName));
    };

    activeReveal.current?.skipTransition();
    if (
      inMenu ||
      !document.startViewTransition ||
      !matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      apply();
      return;
    }

    const { left, top, width, height } = anchor.getBoundingClientRect();
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
  };
  if (inMenu) {
    return (
      <Dropdown.Item
        className="yu-mobile-theme-item"
        onClick={(event) => toggle(event.currentTarget)}
        onSelect={(event) => event.preventDefault()}
      >
        {icon}
        <span>{label}</span>
      </Dropdown.Item>
    );
  }
  return (
    <button
      type="button"
      className="yu-theme-toggle"
      aria-label={label}
      onClick={(event) => toggle(event.currentTarget)}
    >
      {icon}
    </button>
  );
}
