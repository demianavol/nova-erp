import { useCallback, useEffect, useRef, useState } from "react";
import type { CareerBenefit } from "../data/company-careers";
import {
  careerScenes,
  careerSceneForBenefit,
  type CareerScene,
  type CareerSceneId,
} from "../data/career-media";

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}media/careers/${name}`;
const DISSOLVE_MS = 1200;

function FilmLayer({
  scene,
  playing,
  active,
  selected,
  underlay,
  onReady,
  onError,
}: {
  scene: CareerScene;
  playing: boolean;
  active: boolean;
  selected: boolean;
  underlay: number;
  onReady: (id: CareerSceneId) => void;
  onError: (id: CareerSceneId) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [readySource, setReadySource] = useState<string>();
  const ready = readySource === scene.video;

  useEffect(() => {
    const element = video.current;
    if (!element || !playing) return;
    let mounted = true;
    element.muted = true;
    element.playbackRate = 0.85;
    void element
      .play()
      .then(() => {
        if (mounted) setReadySource(scene.video);
      })
      .catch((error: DOMException) => {
        if (mounted && error.name !== "AbortError") onError(scene.id);
      });
    return () => {
      mounted = false;
      element.pause();
    };
  }, [playing, onError, scene.id, scene.video]);

  // Selecting a still-playing layer changes its order, not its media clock.
  useEffect(() => {
    if (playing && selected && ready) onReady(scene.id);
  }, [playing, selected, ready, onReady, scene.id]);

  return (
    <video
      ref={video}
      className="career-team-film-video"
      data-scene={scene.id}
      data-ready={ready}
      data-active={active}
      style={{
        zIndex: active ? careerScenes.length + 1 : underlay || undefined,
        opacity: underlay && ready ? 1 : undefined,
      }}
      src={asset(scene.video)}
      poster={asset(scene.poster)}
      width={1280}
      height={720}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      tabIndex={-1}
      onError={() => onError(scene.id)}
    />
  );
}

/** Keep the outgoing clip moving until the incoming one is ready and dissolved. */
export function CareersAtmosphere({
  benefit,
}: {
  benefit: CareerBenefit["id"];
}) {
  const requested = careerSceneForBenefit(benefit);
  const requestedId = requested?.id ?? null;
  const desired = useRef<CareerSceneId | null>(requestedId);
  desired.current = requestedId;
  const surface = useRef<HTMLDivElement>(null);
  const frontRef = useRef<CareerSceneId | null>(null);
  const [front, setFront] = useState<CareerSceneId | null>(null);
  const [leaving, setLeaving] = useState<CareerSceneId[]>([]);
  const [failed, setFailed] = useState<CareerSceneId[]>([]);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const eligible = near && !reduced;
  const mediaKey = careerScenes.map((scene) => scene.video).join("|");

  // A replaced source can recover from a previous loading failure.
  useEffect(() => {
    setFailed((layers) => (layers.length ? [] : layers));
  }, [mediaKey]);

  const reveal = useCallback((id: CareerSceneId) => {
    // play() can resolve after a rapid selection of a different chapter.
    if (desired.current !== id || frontRef.current === id) return;
    const previous = frontRef.current;
    frontRef.current = id;
    setLeaving((layers) => [
      ...new Set([
        ...layers.filter((layer) => layer !== id),
        ...(previous ? [previous] : []),
      ]),
    ]);
    setFront(id);
  }, []);

  const fail = useCallback((id: CareerSceneId) => {
    setFailed((layers) => (layers.includes(id) ? layers : [...layers, id]));
    if (desired.current === id) {
      frontRef.current = null;
      setFront(null);
      setLeaving([]);
    }
  }, []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    const visibility = () => setTabVisible(!document.hidden);
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "120px 0px", threshold: 0.05 },
    );
    const root = surface.current?.closest(".career-pin");
    if (root) observer.observe(root);
    return () => {
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving([]), DISSOLVE_MS);
    return () => window.clearTimeout(timer);
  }, [front]);

  useEffect(() => {
    if (!reduced && requestedId && !failed.includes(requestedId)) return;
    const previous = frontRef.current;
    frontRef.current = null;
    setFront(null);
    setLeaving(!reduced && requestedId === null && previous ? [previous] : []);
  }, [reduced, failed, requestedId]);

  const still =
    !requested || reduced || failed.includes(requested.id) || front === null
      ? requested
      : careerScenes.find((scene) => scene.id === front)!;

  return (
    <div
      ref={surface}
      className="career-team-film"
      aria-hidden="true"
      data-requested-scene={requestedId ?? "pending"}
      data-visible-scene={front ?? (requested ? "poster" : "pending")}
      data-reduced={reduced}
    >
      {still && (
        <img
          className="career-team-film-poster"
          src={asset(still.poster)}
          alt=""
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
        />
      )}
      {eligible &&
        careerScenes.map(
          (scene) =>
            !failed.includes(scene.id) &&
            (requestedId === scene.id ||
              front === scene.id ||
              leaving.includes(scene.id)) && (
              <FilmLayer
                key={scene.id}
                scene={scene}
                active={front === scene.id}
                selected={requestedId === scene.id}
                underlay={front === null ? 0 : leaving.indexOf(scene.id) + 1}
                playing={
                  visible &&
                  tabVisible &&
                  (requestedId === scene.id ||
                    front === scene.id ||
                    leaving.includes(scene.id))
                }
                onReady={reveal}
                onError={fail}
              />
            ),
        )}
    </div>
  );
}
