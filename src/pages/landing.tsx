import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSiteTheme } from "../components/site-theme";
import { PublicHeader } from "../components/public-header";
import { HeroFilm } from "../components/hero-film";
import { HeroTitle } from "../components/hero-title";
import { BackToTop } from "../components/back-to-top";
import { DirectionsExplorer } from "../components/directions-explorer";
import { GlobalExperience } from "../components/global-experience";
import { CompanyHistory } from "../components/company-history";
import { CompanyPrinciples } from "../components/company-principles";
import { CompanyFuture } from "../components/company-future";
import { CompanyCareers } from "../components/company-careers";
import { CompanyPartnership } from "../components/company-partnership";
import { CompanyFooter } from "../components/company-footer";
import { CompanyMetric } from "../components/company-metric";
import { MetricDetailsProvider } from "../components/company-metric-details";
import { getCompanyMetrics, companyMetricsMode } from "../data/company-metrics";
import { EvidenceMetrics } from "../components/evidence-metrics";
import {
  LandingFontPreview,
  useLandingFontPreview,
} from "../components/landing-font-preview";
import "@fontsource-variable/sofia-sans";
import "../landing.css";
import "../company-page.css";
import "../company-editorial.css";
import "../hero-video.css";
import "../company-metrics.css";
import "../company-typography.css";

export { loadLandingFonts } from "../components/landing-font-preview";

function useRevealOnce<T extends HTMLElement>() {
  const root = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = () => {
      if (media.matches) setRevealed(true);
    };
    show();
    media.addEventListener("change", show);
    if (!("IntersectionObserver" in window)) {
      setRevealed(true);
      return () => media.removeEventListener("change", show);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", show);
    };
  }, []);
  return { root, revealed };
}
export function Landing() {
  const { language, t } = useSiteLanguage();
  const metrics = useMemo(() => getCompanyMetrics(language, t), [language, t]);
  useSiteTheme("dark");
  const { preview, changePreview } = useLandingFontPreview();
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  const { root: resultsRef, revealed: resultsRevealed } =
    useRevealOnce<HTMLElement>();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = t("Young Unicorn — компания и наши бренды");
  }, [t]);
  useEffect(
    () => () => {
      document.title = "Young Unicorn · Рабочее пространство";
    },
    [],
  );
  useEffect(() => {
    if (["#advantages", "#team", "#partners"].includes(location.hash)) {
      navigate("/#contacts", { replace: true });
      return;
    }
    if (location.hash === "#brands") {
      navigate("/#directions", { replace: true });
      return;
    }
    const frame = requestAnimationFrame(() => {
      const id = location.hash.slice(1);
      if (id)
        document.getElementById(id)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, navigate]);
  const jump = (id: string) => {
    if (location.hash === `#${id}`)
      document.getElementById(id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <div className="landing landing-home" data-font-preview={preview?.scope}>
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        <section
          className="lp-hero lp-container lp-hero-video"
          id="hero"
          aria-labelledby="hero-title"
        >
          <div className="lp-hero-copy">
            <div className="hero-meta">{t("ПРОДУКТОВАЯ МЕДИА-КОМПАНИЯ")}</div>
            <HeroTitle />
          </div>
          <HeroFilm />
        </section>
        <section
          ref={resultsRef}
          className={`lp-results lp-container${resultsRevealed ? " is-revealed" : ""}`}
          id="results"
          aria-labelledby="results-title"
        >
          <div className="lp-results-caption">
            <h2 id="results-title" className="lp-block-title">
              {t("Компания в цифрах")}
            </h2>
            <span className="lp-metrics-prototype">
              {companyMetricsMode === "demo"
                ? t("Прототип · Тестовые данные")
                : t("Прототип · Данные на согласовании")}
            </span>
          </div>
          <MetricDetailsProvider>
            <div className="lp-metrics">
              {metrics.slice(0, 4).map((metric, index) => (
                <CompanyMetric key={metric.id} metric={metric} index={index} />
              ))}
            </div>
            <EvidenceMetrics metrics={metrics.slice(4)} />
          </MetricDetailsProvider>
        </section>
        <DirectionsExplorer />
        <GlobalExperience />
        <section
          className="company-journey lp-container lp-section"
          id="about"
          aria-labelledby="about-title"
        >
          <CompanyHistory />
        </section>
        <CompanyPrinciples />
        <CompanyFuture />
        <CompanyCareers />
        <CompanyPartnership />
      </main>
      <BackToTop footer={footer} />
      <CompanyFooter onJump={jump} footerRef={setFooter} />
      {preview && (
        <LandingFontPreview preview={preview} onChange={changePreview} />
      )}
    </div>
  );
}
