import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import {
  createElectricLogoFilm,
  createGlassFilm2D,
} from "./react-bits/electric-logo-film";
import { HeroFigureLabels } from "./hero-figure-labels";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const poster = asset("young-unicorn-glass.webp");

export function HeroFilm() {
  const { t } = useSiteLanguage();
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const spotlight = useRef<HTMLCanvasElement>(null);
  const retry = useRef<() => void>(() => {});
  const [staticMode, setStaticMode] = useState(true);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterPainted, setPosterPainted] = useState(false);
  const [ready, setReady] = useState(false);
  const [software, setSoftware] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const print = matchMedia("print");
    const landing = stage.current?.closest(".landing");
    const update = () => {
      setStaticMode(
        media.matches ||
          print.matches ||
          landing?.getAttribute("data-export") === "pdf",
      );
    };
    const observer = new MutationObserver(update);
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
    // Let the browser paint the hero before initializing the renderer.
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
    const recover = () => {
      setReady(false);
      if (software) setFailed(true);
      else setSoftware(true);
    };
    const renderer = software
      ? createGlassFilm2D(surface, element)
      : createElectricLogoFilm(surface, element);
    if (!renderer) {
      recover();
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
      if (result === "failed") recover();
      if (result !== "drawn") return;
      const detail = spotlight.current;
      const detailContext = detail?.getContext("2d");
      if (detail && detailContext) {
        if (detail.width !== surface.width || detail.height !== surface.height) {
          detail.width = surface.width;
          detail.height = surface.height;
        }
        detailContext.globalCompositeOperation = "copy";
        detailContext.drawImage(surface, 0, 0);
        detail.dataset.ready = "true";
      }
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
        2,
        1280 / Math.max(1, width),
      );
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (surface.width !== pixelWidth || surface.height !== pixelHeight) {
        surface.width = pixelWidth;
        surface.height = pixelHeight;
      }
    });
    if (!software) resize.observe(surface);
    const lost = (event: Event) => {
      event.preventDefault();
      recover();
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
  }, [animated, software]);

  return (
    <>
      <div className="lp-hero-atmosphere" aria-hidden="true" />
      <div
        ref={stage}
        className="lp-hero-mark"
        data-ready={animated && ready}
      >
        <img
          className="lp-hero-mark-poster"
          src={poster}
          width={640}
          height={540}
          alt=""
          fetchPriority="high"
          onLoad={() => setPosterLoaded(true)}
          onError={() => setPosterLoaded(true)}
        />
        {animated && (
          <>
            <canvas
              key={software ? "2d" : "webgl"}
              ref={canvas}
              className="lp-hero-mark-canvas"
              data-renderer={software ? "2d" : "webgl"}
              aria-hidden="true"
            />
            <video
              ref={video}
              className="lp-hero-mark-source"
              src={asset("young-unicorn-glass.mp4")}
              muted
              loop
              playsInline
              preload="metadata"
              tabIndex={-1}
              aria-hidden="true"
              onError={() => setFailed(true)}
            />
          </>
        )}
        <HeroFigureLabels poster={poster} spotlightCanvas={spotlight} />
      </div>
      {blocked && animated && (
        <button
          type="button"
          className="hero-video-retry"
          onClick={() => retry.current()}
        >
          <Play size={14} aria-hidden="true" />
          {t("Запустить видео")}</button>
      )}
    </>
  );
}
