import { useSiteLanguage } from "../lib/site-language";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./tech-title.css";

const TechText = lazy(() =>
  import("./react-bits/TechText").catch(() => ({ default: () => null })),
);

export function useTechTitleMotion(hoverOnly = false) {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = matchMedia(
      hoverOnly
        ? "(prefers-reduced-motion: no-preference) and (any-hover: hover) and (any-pointer: fine)"
        : "(prefers-reduced-motion: no-preference)",
    );
    let mounted = true;
    const update = () => {
      if (!preference.matches) {
        setMotion(false);
        return;
      }
      // Keep the native heading visible until the canvas can use the final font.
      void document.fonts.ready.then(() => {
        if (mounted && preference.matches) setMotion(true);
      });
    };
    preference.addEventListener("change", update);
    update();
    return () => {
      mounted = false;
      preference.removeEventListener("change", update);
    };
  }, [hoverOnly]);
  return motion;
}

export function TechTitleLine({
  text,
  motion,
  fontWeight = 450,
  intro = "metrics",
  nativeMetrics = false,
  clickKick = true,
  className = "",
}: {
  text: string;
  motion: boolean;
  fontWeight?: number;
  intro?: "none" | "metrics";
  nativeMetrics?: boolean;
  clickKick?: boolean;
  className?: string;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  return (
    <span className={`hero-tech-line ${className}`.trim()} ref={lineRef}>
      <span className="hero-tech-native">{text}</span>
      {motion && (
        <span className="hero-tech-effect" aria-hidden="true">
          <Suspense fallback={null}>
            <TechText
              text={text.trimEnd()}
              inline
              nativeMetrics={nativeMetrics}
              pointerTarget={nativeMetrics ? lineRef : undefined}
              align="left"
              fontWeight={fontWeight}
              letterSpacing={-0.055}
              intro={intro}
              introDuration={1.15}
              specks={7}
              dashLength={3}
              dashGap={2.5}
              strokeWidth={1.1}
              sweep={false}
              draggable={false}
              labels={false}
              clickKick={clickKick}
            />
          </Suspense>
        </span>
      )}
    </span>
  );
}

export function HeroTitle() {
  const { language, t } = useSiteLanguage();
  const motion = useTechTitleMotion();
  return (
    <h1 id="hero-title" tabIndex={-1}>
      <TechTitleLine
        text={t("Создаём") + (language === "zh-CN" ? "" : " ")}
        motion={motion}
        intro="none"
        nativeMetrics
      />
      <TechTitleLine
        text={t("бренды")}
        motion={motion}
        intro="none"
        nativeMetrics
      />
    </h1>
  );
}
