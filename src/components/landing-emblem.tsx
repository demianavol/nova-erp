import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNearViewport } from "./use-near-viewport";
import "../landing-emblem.css";

type CareerEmblemKind =
  | "career-growth"
  | "career-impact"
  | "career-team"
  | "career-projects"
  | "career-freedom"
  | "career-learning";

export function LandingEmblem({
  kind,
  active,
  visible,
  loadOnSelect = false,
}: {
  kind: CareerEmblemKind;
  active: boolean;
  visible: boolean;
  loadOnSelect?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const near = useNearViewport(root);
  const [readySheet, setReadySheet] = useState<string>();
  const media = `${import.meta.env.BASE_URL}media/emblems/${kind}`;
  // CSS resolves a URL in a custom property against the consuming stylesheet.
  const sheet = new URL(`${media}-sheet.webp?layout=12x7`, document.baseURI)
    .href;
  const ready = readySheet === sheet;
  const eligible = near && (!loadOnSelect || active);

  useEffect(() => {
    if (!eligible || ready) return;
    const preference = matchMedia("(prefers-reduced-motion: no-preference)");
    let mounted = true;
    const load = () => {
      if (!preference.matches) return;
      const image = new Image();
      image.src = sheet;
      void image.decode().then(
        () => {
          if (mounted) setReadySheet(sheet);
        },
        () => {},
      );
    };
    load();
    preference.addEventListener("change", load);
    return () => {
      mounted = false;
      preference.removeEventListener("change", load);
    };
  }, [eligible, ready, sheet]);

  return (
    <span
      ref={root}
      className="landing-emblem"
      data-emblem={kind}
      data-emblem-active={active || undefined}
      data-emblem-visible={visible || undefined}
      data-emblem-ready={ready || undefined}
      style={
        ready
          ? ({ "--emblem-sheet": `url("${sheet}")` } as CSSProperties)
          : undefined
      }
      aria-hidden="true"
    >
      <img
        src={`${media}-poster.webp`}
        className="landing-emblem-poster"
        width={128}
        height={128}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="landing-emblem-sequence" />
    </span>
  );
}
