import { lazy, Suspense, useEffect, useState } from "react";

const TechText = lazy(() =>
  import("./react-bits/TechText").catch(() => ({ default: () => null })),
);

export function HeroTitle() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    preference.addEventListener("change", update);
    update();
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <h1 id="hero-title">
      {["Создаём", "бренды"].map((line, index) => (
        <span className="hero-tech-line" key={line}>
          <span className="hero-tech-native">
            {line}
            {index === 0 ? " " : ""}
          </span>
          {motion && (
            <span className="hero-tech-effect" aria-hidden="true">
              <Suspense fallback={null}>
                <TechText
                  text={line}
                  inline
                  align="left"
                  fontWeight={450}
                  letterSpacing={-0.055}
                  intro="metrics"
                  introDuration={1.15}
                  specks={7}
                  dashLength={3}
                  dashGap={2.5}
                  strokeWidth={1.1}
                  sweep={false}
                  draggable={false}
                  labels={false}
                  clickKick
                />
              </Suspense>
            </span>
          )}
        </span>
      ))}
    </h1>
  );
}
