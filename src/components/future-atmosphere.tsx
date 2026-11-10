import { lazy, Suspense, useEffect, useRef, useState } from "react";
const GradientWaves = lazy(() => import("./react-bits/GradientWaves"));
const film = `${import.meta.env.BASE_URL}media/future/future-atmosphere`;

export function FutureBackgroundFilm() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !motion.matches) {
        void element.play().catch(() => {});
      } else {
        element.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, []);

  return (
    <div
      className="future-atmosphere future-atmosphere--film"
      aria-hidden="true"
    >
      <video
        ref={video}
        src={`${film}.mp4`}
        poster={`${film}-poster.webp`}
        muted
        loop
        playsInline
        preload="none"
      />
    </div>
  );
}

export function FutureAtmosphere({ paused }: { paused: boolean }) {
  const surface = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.siteTheme === "dark",
  );
  useEffect(() => {
    const theme = new MutationObserver(() =>
      setDark(document.documentElement.dataset.siteTheme === "dark"),
    );
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-site-theme"],
    });
    const view = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          view.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    if (surface.current) view.observe(surface.current);
    return () => {
      theme.disconnect();
      view.disconnect();
    };
  }, []);
  return (
    <div ref={surface} className="future-atmosphere" aria-hidden="true">
      {near && (
        <Suspense fallback={null}>
          <GradientWaves
            className="future-gradient-waves"
            horizonColor={dark ? "#633896" : "#9b73c1"}
            waveColor={dark ? "#ab73e0" : "#a26bce"}
            crestColor={dark ? "#ead6ff" : "#d4b3ed"}
            lightMode={!dark}
            speed={0.22}
            amplitude={2.2}
            relief={0.85}
            lightAngle={120}
            waveScale={0.62}
            swell={28}
            turbulence={10}
            fogDepth={22}
            opacity={dark ? 0.45 : 0.6}
            brightness={dark ? 1 : 1.05}
            sheen={0.08}
            grain={0}
            quality="medium"
            dpr={0.85}
            intro={false}
            mouseInteraction
            parallaxStrength={0.2}
            mouseStrength={0.35}
            swellOnClick={false}
            paused={paused}
          />
        </Suspense>
      )}
    </div>
  );
}
