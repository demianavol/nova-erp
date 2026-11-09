import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../back-to-top.css";

export function BackToTop({ footer }: { footer: HTMLElement | null }) {
  const { t } = useSiteLanguage();
  const [visible, setVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(
          entry.boundingClientRect.top < 0 && entry.intersectionRatio <= 0.05,
        ),
      { rootMargin: "-84px 0px 0px 0px", threshold: 0.05 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!footer) {
      setFooterVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [footer]);

  if (!visible || footerVisible) return null;
  return (
    <Link
      to="/#hero"
      replace
      className="lp-back-to-top"
      aria-label={t("Наверх — к началу страницы")}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        // The hero hash uses the landing's smooth section navigation. Handle repeats too.
        if (location.hash === "#hero") {
          window.scrollTo({
            top: 0,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
        }
        document.getElementById("hero-title")?.focus({ preventScroll: true });
      }}
    >
      <ArrowUp size={17} aria-hidden="true" />
      <span>{t("Наверх")}</span>
    </Link>
  );
}
