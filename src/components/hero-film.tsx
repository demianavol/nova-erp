import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { createElectricLogoFilm } from "./react-bits/electric-logo-film";

const LiquidEther = lazy(() =>
  import("./react-bits/LiquidEther").catch(() => ({ default: () => null })),
);
const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const lightPalette = ["#9060c7", "#c491e8", "#a883df"];
const darkPalette = ["#7542c5", "#ba78e8", "#8a5bdd"];

export function HeroFilm() {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const retry = useRef<() => void>(() => {});
  const [staticMode, setStaticMode] = useState(true);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterPainted, setPosterPainted] = useState(false);
  const [light, setLight] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const print = matchMedia("print");
    const page = document.documentElement;
    const landing = stage.current?.closest(".landing");
    const update = () => {
      setStaticMode(
        media.matches ||
          print.matches ||
          landing?.getAttribute("data-export") === "pdf",
      );
      setLight(page.dataset.siteTheme !== "dark");
    };
    const observer = new MutationObserver(update);
    observer.observe(page, {
      attributes: true,
      attributeFilter: ["data-site-theme"],
    });
    if (landing)
      observer.observe(landing, {
        attributes: true,
        attributeFilter: ["data-export"],
      });
    media.addEventListener("change", update);
    print.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      print.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!posterLoaded) return;
    // Let the browser paint the hero before initializing either WebGL effect.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPosterPainted(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [posterLoaded]);

  const animated = posterPainted && !staticMode && !failed;
  useEffect(() => {
    const element = video.current;
    const surface = canvas.current;
    const hero = stage.current?.closest<HTMLElement>("#hero");
    if (!animated || !element || !surface || !hero) return;
    const renderer = createElectricLogoFilm(surface, element);
    if (!renderer) {
      setFailed(true);
      return;
    }
    let alive = true;
    let visible = false;
    let handle = 0;
    let decodedFrame = -1;
    let revealed = false;
    const page = document.documentElement;
    let themeRevealing = page.hasAttribute("data-site-theme-reveal");
    const hasVideoCallback =
      typeof element.requestVideoFrameCallback === "function";
    const active = () =>
      alive && visible && !document.hidden && !themeRevealing;
    const draw = (mediaTime: number) => {
      if (!active() || element.readyState < 2) return;
      const result = renderer.draw(
        mediaTime,
        document.documentElement.dataset.siteTheme !== "dark",
      );
      if (result === "failed") setFailed(true);
      if (result !== "drawn") return;
      if (!revealed) {
        revealed = true;
        setReady(true);
      }
    };
    const next = () => {
      if (!active() || element.paused || handle) return;
      handle = hasVideoCallback
        ? element.requestVideoFrameCallback(onFrame)
        : requestAnimationFrame(onTick);
    };
    const onFrame: VideoFrameRequestCallback = (_, metadata) => {
      handle = 0;
      draw(metadata.mediaTime);
      next();
    };
    const onTick = () => {
      handle = 0;
      const count =
        element.getVideoPlaybackQuality?.().totalVideoFrames ||
        Math.floor(element.currentTime * 24);
      if (count !== decodedFrame && element.readyState >= 2) {
        decodedFrame = count;
        draw(element.currentTime);
      }
      next();
    };
    const stop = () => {
      if (hasVideoCallback) element.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      handle = 0;
    };
    const sync = () => {
      if (!active()) {
        stop();
        element.pause();
        return;
      }
      void element
        .play()
        .then(() => {
          if (!active()) return;
          setBlocked(false);
          next();
        })
        .catch((error: DOMException) => {
          if (active() && error.name !== "AbortError") setBlocked(true);
        });
    };
    retry.current = sync;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(hero);
    const themeObserver = new MutationObserver(() => {
      themeRevealing = page.hasAttribute("data-site-theme-reveal");
      sync();
    });
    themeObserver.observe(page, {
      attributeFilter: ["data-site-theme-reveal"],
    });
    const resize = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      const ratio = Math.min(
        devicePixelRatio || 1,
        1.35,
        768 / Math.max(1, width),
      );
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (surface.width !== pixelWidth || surface.height !== pixelHeight) {
        surface.width = pixelWidth;
        surface.height = pixelHeight;
      }
    });
    resize.observe(surface);
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    const gesture = () => {
      if (element.paused) sync();
    };
    hero.addEventListener("pointerdown", gesture, { passive: true });
    element.addEventListener("playing", next);
    element.addEventListener("pause", stop);
    surface.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      alive = false;
      stop();
      intersection.disconnect();
      themeObserver.disconnect();
      resize.disconnect();
      hero.removeEventListener("pointerdown", gesture);
      element.removeEventListener("playing", next);
      element.removeEventListener("pause", stop);
      surface.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      retry.current = () => {};
      element.pause();
      renderer.dispose();
      setReady(false);
      setBlocked(false);
    };
  }, [animated]);

  return (
    <>
      <div className="lp-hero-atmosphere" aria-hidden="true">
        {animated && (ready || blocked) && (
          <Suspense fallback={null}>
            <LiquidEther
              colors={light ? lightPalette : darkPalette}
              lightMode={light}
              intensity={1.55}
              mouseForce={12}
              cursorSize={125}
              resolution={0.24}
              maxDevicePixelRatio={1}
              autoSpeed={0.34}
              autoIntensity={1.65}
              clickBurst={false}
              intro={false}
            />
          </Suspense>
        )}
      </div>
      <div
        ref={stage}
        className="lp-hero-mark"
        data-ready={animated && ready}
        aria-hidden="true"
      >
        <img
          className="lp-hero-mark-poster"
          src={asset("young-unicorn-glass.webp")}
          width={512}
          height={432}
          alt=""
          fetchPriority="high"
          onLoad={() => setPosterLoaded(true)}
          onError={() => setPosterLoaded(true)}
        />
        {animated && (
          <>
            <canvas ref={canvas} className="lp-hero-mark-canvas" />
            <video
              ref={video}
              className="lp-hero-mark-source"
              src={asset("young-unicorn-glass.mp4")}
              muted
              loop
              playsInline
              preload="metadata"
              tabIndex={-1}
              onError={() => setFailed(true)}
            />
          </>
        )}
      </div>
      {blocked && animated && (
        <button
          type="button"
          className="hero-video-retry"
          onClick={() => retry.current()}
        >
          <Play size={14} aria-hidden="true" />
          Запустить видео
        </button>
      )}
    </>
  );
}
