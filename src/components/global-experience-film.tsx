import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useRef, useState } from "react";
import type { ExperienceCountryId } from "../data/global-experience";
import type { VideoCompositor } from "./global-experience-video-compositor";
import { useLandingMobile } from "./use-landing-mobile";

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}media/global-experience/${name}`;

/** Original moving footage plus synchronized per-flag mattes, never 3D cloth. */
export function GlobalExperienceFilm({
  selected,
}: {
  selected: ExperienceCountryId | null;
}) {
  const { t } = useSiteLanguage();
  const mobile = useLandingMobile();
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const compositor = useRef<VideoCompositor | null>(null);
  const playhead = useRef(0);
  const selection = useRef(selected);
  selection.current = selected;
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.siteTheme ?? "light",
  );
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [failed, setFailed] = useState(false);
  const [readyVideo, setReadyVideo] = useState<HTMLVideoElement>();
  const light = theme === "light";
  const source = asset(
    mobile
      ? light
        ? "flags-mobile-light.mp4"
        : "flags-mobile-dark.mp4"
      : light
        ? "flags-film-native-light-v3.mp4"
        : "flags-film-masked-v3.mp4",
  );
  const poster = asset(
    light
      ? "flags-native-light-poster.webp"
      : "flags-isolated-dark-poster.webp",
  );
  const eligible = near && !reduced && !failed;
  const playing = eligible && visible && tabVisible;
  useEffect(() => setFailed(false), [source]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(preference.matches);
    const visibility = () => setTabVisible(!document.hidden);
    const applyTheme = () =>
      setTheme(document.documentElement.dataset.siteTheme ?? "light");
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-site-theme"],
    });
    applyTheme();
    preference.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const element = root.current;
    let preload: IntersectionObserver | undefined,
      view: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      preload = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setNear(true);
            preload?.disconnect();
          }
        },
        { rootMargin: "400px" },
      );
      view = new IntersectionObserver(
        (entries) => setVisible(entries.some((e) => e.isIntersecting)),
        { threshold: 0.01 },
      );
      if (element) {
        preload.observe(element);
        view.observe(element);
      }
    } else {
      setNear(true);
      setVisible(true);
    }
    return () => {
      observer.disconnect();
      preload?.disconnect();
      view?.disconnect();
      preference.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!eligible || mobile || !video.current || !canvas.current) return;
    const element = video.current,
      surface = canvas.current;
    let disposed = false,
      renderer: VideoCompositor | undefined;
    void import("./global-experience-video-compositor")
      .then(({ createVideoCompositor }) => {
        if (disposed) return;
        renderer = createVideoCompositor(
          element,
          surface,
          () => setReadyVideo(element),
          () => setFailed(true),
          light,
        );
        if (renderer) {
          compositor.current = renderer;
          renderer.select(selection.current);
        } else setFailed(true);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      renderer?.dispose();
      compositor.current = null;
    };
  }, [eligible, light, mobile, source]);

  useEffect(() => {
    compositor.current?.select(selected);
  }, [selected]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let mounted = true;
    if (playing) {
      element.muted = true;
      void element.play().catch((error: DOMException) => {
        if (mounted && error.name !== "AbortError") setFailed(true);
      });
    } else element.pause();
    return () => {
      mounted = false;
      element.pause();
    };
  }, [playing, source]);

  const film = eligible && (
    <video
      ref={video}
      key={source}
      className={mobile ? "ge-film-native" : "ge-film-source"}
      src={source}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden="true"
      onPlaying={(event) => {
        if (mobile) setReadyVideo(event.currentTarget);
      }}
      onError={() => setFailed(true)}
      onLoadedMetadata={(event) => {
        const element = event.currentTarget;
        const time = Math.min(
          playhead.current,
          Math.max(0, element.duration - 0.1),
        );
        if (time > 0) element.currentTime = time;
      }}
      onTimeUpdate={(event) => {
        if (event.currentTarget.currentTime > 0.1)
          playhead.current = event.currentTarget.currentTime;
      }}
    />
  );
  return (
    <div
      ref={root}
      className="ge-film"
      data-playing={playing}
      data-reduced={reduced}
      data-ready={
        eligible &&
        readyVideo === video.current &&
        readyVideo?.getAttribute("src") === source
      }
      data-selection={selected ?? "all"}
    >
      <div
        className="ge-film-picture"
        role="img"
        aria-label={t("Флаги Китая, Кыргызстана и Узбекистана")}
      >
        <img
          className="ge-film-poster"
          src={poster}
          width={896}
          height={720}
          alt=""
          loading="lazy"
          decoding="async"
        />
        {mobile ? (
          film
        ) : (
          <canvas ref={canvas} className="ge-film-canvas" aria-hidden="true" />
        )}
      </div>
      {!mobile && film}
    </div>
  );
}
