import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
export function HeroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    const update = () => {
      setReduced(media.matches);
      if (!paused && !media.matches && visible && !document.hidden) {
        element.muted = true;
        void element.play().catch(() => setReady(false));
      } else element.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      element.pause();
    };
  }, [paused]);
  return (
    <>
      <div className="lp-hero-film" aria-hidden="true">
        <img
          src={asset("enmoone-hero-poster.webp")}
          width="1280"
          height="720"
          alt=""
          fetchPriority="high"
        />
        <video
          ref={video}
          className={ready ? "is-ready" : ""}
          muted
          loop
          playsInline
          preload="metadata"
          poster={asset("enmoone-hero-poster.webp")}
          tabIndex={-1}
          onPlaying={() => setReady(true)}
          onError={() => setReady(false)}
        >
          <source src={asset("enmoone-hero-film.mp4")} type="video/mp4" />
        </video>
      </div>
      {!reduced && (
        <button
          type="button"
          className="lp-hero-film-control"
          aria-label={
            paused
              ? "Включить видео первого экрана"
              : "Приостановить видео первого экрана"
          }
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? "Смотреть" : "Пауза"}
        </button>
      )}
    </>
  );
}
