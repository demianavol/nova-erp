import { useEffect, useId, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import "./onboarding-emoji.css";

const scenes = [
  "learning",
  "org-chart",
  "toolkit",
  "documents",
  "product",
  "marketing",
  "sales",
  "content",
  "finance",
  "it",
  "hr",
  "purchasing",
  "warehouse",
] as const;

type Scene = (typeof scenes)[number];
type Emoji = Scene | "chats" | "calls" | "rules" | "access";

function useEmojiMotion(duration: number) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const icon = ref.current;
    const trigger = icon?.closest("a, button, li");
    if (!icon || !trigger) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeout: number | undefined;
    function stop() {
      window.clearTimeout(timeout);
      timeout = undefined;
      icon?.removeAttribute("data-playing");
    }
    function play() {
      if (reduced.matches || timeout !== undefined) return;
      icon?.setAttribute("data-playing", "");
      timeout = window.setTimeout(stop, duration + 70);
    }

    let observer: IntersectionObserver | undefined;
    if (
      window.matchMedia("(hover: none)").matches &&
      "IntersectionObserver" in window
    ) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio < 0.75) return;
          play();
          observer?.disconnect();
        },
        { threshold: 0.75 },
      );
      observer.observe(icon);
    }

    trigger.addEventListener("pointerenter", play);
    trigger.addEventListener("focusin", play);
    reduced.addEventListener("change", stop);
    return () => {
      stop();
      observer?.disconnect();
      trigger.removeEventListener("pointerenter", play);
      trigger.removeEventListener("focusin", play);
      reduced.removeEventListener("change", stop);
    };
  }, [duration]);

  return ref;
}

function EmojiScene({ asset, src }: { asset: Scene; src: string }) {
  const id = useId();
  const gradient = (name: string) => `url(#${id}-${name})`;

  // Reuse the source pixels for each moving part so color and lighting match the poster.
  function slice(name: string, path: string, className?: string) {
    const clip = `${id}-${name}`;
    return (
      <g className={className}>
        <clipPath id={clip}>
          <path d={path} />
        </clipPath>
        <use href={`#${id}-sprite`} clipPath={`url(#${clip})`} />
      </g>
    );
  }

  let parts: ReactNode;
  switch (asset) {
    case "learning":
      parts = (
        <>
          <defs>
            <radialGradient id={`${id}-dial`}>
              <stop stopColor="#f2e8f8" />
              <stop offset="1" stopColor="#d9c6e8" />
            </radialGradient>
            <linearGradient id={`${id}-needle`} x2="0" y2="1">
              <stop stopColor="#ffac8e" />
              <stop offset="1" stopColor="#e34d45" />
            </linearGradient>
          </defs>
          <use href={`#${id}-sprite`} />
          <path
            d="M36 89Q32 91 35 85L55 59 85 50Q90 49 87 55L72 81 40 93Q35 94 36 89Z"
            fill={gradient("dial")}
          />
          <g className="erp-emoji-needle">
            <path
              d="M85 51 70 80 37 94 54 65Z"
              fill={gradient("needle")}
              stroke="#a44556"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M85 51 61 72 37 94 54 65Z" fill="#ffae94" opacity=".62" />
            <circle cx="61" cy="72" r="9" fill="#a74c62" />
            <circle cx="61" cy="71" r="7" fill="#fff0e7" />
          </g>
        </>
      );
      break;
    case "org-chart":
      parts = (
        <>
          <use href={`#${id}-sprite`} />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path className="erp-emoji-org-line" d="M64 48V83" pathLength="1" />
            <path
              className="erp-emoji-org-line erp-emoji-org-branch"
              d="M64 68H36Q25 68 25 80V83M64 68H92Q103 68 103 80V83"
              pathLength="1"
            />
            <rect
              className="erp-emoji-org-node"
              x="11"
              y="86"
              width="27"
              height="24"
              rx="7"
            />
            <rect
              className="erp-emoji-org-node"
              x="50"
              y="86"
              width="27"
              height="24"
              rx="7"
            />
            <rect
              className="erp-emoji-org-node"
              x="90"
              y="86"
              width="27"
              height="24"
              rx="7"
            />
          </g>
        </>
      );
      break;
    case "toolkit":
      parts = (
        <>
          <path
            className="erp-emoji-kit-inside"
            d="M13 57 26 43H113L117 57 106 73H22Z"
            fill="#784521"
            stroke="#ffca55"
            strokeWidth="2"
          />
          {slice("case", "M0 61H105L128 49V128H0Z")}
          <g
            className="erp-emoji-kit-tools"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="m34 62-5-23m0 0-4-5 2-10 5 6 7-3-1 10-9 2"
              stroke="#b9ddf5"
              strokeWidth="5"
            />
            <path d="m55 62 4-24" stroke="#5ef0c0" strokeWidth="9" />
            <path d="m59 38 2-15" stroke="#f1f5fb" strokeWidth="4" />
            <path d="m79 61 6-21m-11-6 20 5" stroke="#e18cf8" strokeWidth="8" />
          </g>
          {slice(
            "lid",
            "M0 0H128V49L105 65H68V73H52V65L0 62Z",
            "erp-emoji-kit-lid",
          )}
        </>
      );
      break;
    case "documents":
      parts = (
        <>
          <path
            d="M12 48V39Q12 29 23 29H101Q114 29 114 41V92H12Z"
            fill="#345dc2"
            stroke="#6d9ef0"
            strokeWidth="2"
          />
          <g className="erp-emoji-paper-back">
            <rect
              x="27"
              y="22"
              width="72"
              height="62"
              rx="7"
              fill="#f4d9b7"
              stroke="#e3b98d"
              strokeWidth="2"
              transform="rotate(-13 63 53)"
            />
            <path
              d="m39 38 42-10m-39 20 28-6"
              stroke="#c89572"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
          <g className="erp-emoji-paper-front">
            <rect
              x="33"
              y="34"
              width="75"
              height="63"
              rx="7"
              fill="#e9edff"
              stroke="#a0b7ff"
              strokeWidth="2"
              transform="rotate(-7 70 65)"
            />
            <path
              d="m43 49 50-6m-49 17 33-4"
              stroke="#839ed8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
          {slice(
            "folder",
            "M0 51 13 49 49 44 58 49 64 56 108 49 128 48V128H0Z",
          )}
        </>
      );
      break;
    case "product":
      parts = (
        <>
          <path
            d="m13 35 52-29 51 28-52 30Z"
            fill="#492578"
            stroke="#a47ae4"
            strokeWidth="2"
          />
          <path
            className="erp-emoji-box-spark"
            d="m64 3 3 7 7 3-7 3-3 8-3-8-7-3 7-3Z"
            fill="#ffecaa"
          />
          {slice("box", "M0 28 13 33 63 62 116 32 128 28V128H0Z")}
          {slice(
            "box-lid",
            "M0 0H128V32L116 35 63 64 13 36 0 29Z",
            "erp-emoji-box-lid",
          )}
        </>
      );
      break;
    case "marketing":
      parts = (
        <>
          {slice("horn", "M0 0H101V128H0Z")}
          <g fill="none" strokeLinecap="round" strokeWidth="6">
            <path
              className="erp-emoji-voice"
              d="m101 53 8-5m-6 13 10 0m-11 9 8 5"
              stroke="#ffe086"
            />
            <path
              className="erp-emoji-voice erp-emoji-voice-echo"
              d="m109 49 8-5m-5 17h11m-13 13 8 5"
              stroke="#ffbb53"
            />
          </g>
        </>
      );
      break;
    case "sales":
      parts = (
        <>
          <use href={`#${id}-sprite`} />
          <g className="erp-emoji-sale-receipt">
            <path
              d="M39 11H89Q94 11 94 16V57L87 52 80 57 73 52 66 57 59 52 52 57 44 52 37 57V17Q37 11 39 11Z"
              fill="#ffefd9"
              stroke="#f4ca91"
              strokeWidth="2"
            />
            <path
              d="M48 23H77M48 31H67"
              stroke="#d9aa78"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="m70 39 6 6 10-12"
              fill="none"
              stroke="#249c68"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path
            className="erp-emoji-sale-glow"
            d="M103 72V64M116 77l6-6m-2 19h7"
            fill="none"
            stroke="#ffe07d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g className="erp-emoji-sale-badge">
            <circle
              cx="93"
              cy="96"
              r="21"
              fill="#228857"
              stroke="#aef5c7"
              strokeWidth="3"
            />
            <path
              d="m83 96 7 7 13-15"
              fill="none"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
      break;
    case "content":
      parts = (
        <>
          {slice("slate", "M0 48H128V128H0Z")}
          {slice("arm", "M0 0H128V34L20 63H0Z", "erp-emoji-clapper")}
          <path
            className="erp-emoji-clap-flash"
            d="m116 32 7-8m-4 16 8-1m-6 8 6 4"
            fill="none"
            stroke="#ffda79"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "finance":
      parts = (
        <>
          <defs>
            <linearGradient id={`${id}-coin-rim`} x2=".3" y2="1">
              <stop stopColor="#fff3a2" />
              <stop offset=".32" stopColor="#ffc639" />
              <stop offset="1" stopColor="#c66a06" />
            </linearGradient>
            <linearGradient id={`${id}-coin-face`} x2=".35" y2="1">
              <stop stopColor="#f29a08" />
              <stop offset="1" stopColor="#ffd044" />
            </linearGradient>
          </defs>
          <path d="M29 51V40Q42 33 65 34Q92 33 102 40V53Z" fill="#064c50" />
          <g className="erp-emoji-wallet-coin">
            <circle cx="65" cy="39" r="34" fill={gradient("coin-rim")} />
            <circle
              cx="65"
              cy="39"
              r="26"
              fill={gradient("coin-face")}
              stroke="#e89116"
              strokeWidth="2"
            />
            <path
              d="m65 21 5 11 13 2-9 9 2 13-11-6-12 6 2-13-9-9 13-2Z"
              fill="#ffcd42"
              stroke="#ffdf6f"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
          {slice("wallet", "M0 0H32V50Q65 52 99 50V0H128V128H0Z")}
          <path
            className="erp-emoji-wallet-spark"
            d="M108 5 111 13 119 16 111 19 108 27 105 19 97 16 105 13Z"
            fill="#ffeb9a"
          />
        </>
      );
      break;
    case "it":
      parts = (
        <>
          <use href={`#${id}-sprite`} />
          <g fill="none" stroke="#c5fbff" strokeWidth="5" strokeLinecap="round">
            <path
              className="erp-emoji-chip-signal"
              d="M13 40H31L45 52M12 65H43M13 90H31L45 77"
              pathLength="1"
            />
            <path
              className="erp-emoji-chip-signal"
              d="M85 52 98 40H115M87 65H116M85 77 98 90H115"
              pathLength="1"
            />
          </g>
          <rect
            className="erp-emoji-chip-core"
            x="43"
            y="39"
            width="43"
            height="49"
            rx="9"
            fill="#dcffff"
          />
        </>
      );
      break;
    case "hr":
      parts = (
        <>
          <use href={`#${id}-sprite`} />
          <g className="erp-emoji-team-chat">
            <path
              d="M15 5H60Q68 5 68 13V26Q68 34 60 34H43L33 42V34H15Q7 34 7 26V13Q7 5 15 5Z"
              fill="#f8e8ff"
              stroke="#bb83f0"
              strokeWidth="3"
            />
            <circle cx="23" cy="20" r="3" fill="#844fb7" />
            <circle cx="37" cy="20" r="3" fill="#844fb7" />
            <circle cx="51" cy="20" r="3" fill="#844fb7" />
          </g>
        </>
      );
      break;
    case "purchasing":
      parts = (
        <>
          <use href={`#${id}-sprite`} />
          <rect x="31" y="48" width="64" height="49" rx="9" fill="#ffebcb" />
          <path
            className="erp-emoji-order-check"
            d="m37 74 14 14 35-36"
            fill="none"
            stroke="#2ba22e"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
          />
        </>
      );
      break;
    case "warehouse":
      parts = (
        <>
          {slice("rack", "M0 0H128V128H0ZM32 8V52H94V8Z")}
          <path d="M32 29H94V52H32Z" fill="#252476" />
          {slice("parcel", "M31 7H94V52H31Z", "erp-emoji-rack-parcel")}
        </>
      );
      break;
  }

  return (
    <svg className="erp-emoji-scene" viewBox="0 0 128 128" focusable="false">
      <defs>
        <image id={`${id}-sprite`} href={src} width="128" height="128" />
      </defs>
      {parts}
    </svg>
  );
}

export function OnboardingEmoji({ asset }: { asset: Emoji }) {
  const scene = scenes.find((name) => name === asset);
  const duration = scene ? 1240 : 2400;
  const ref = useEmojiMotion(duration);
  const src = `${import.meta.env.BASE_URL}media/onboarding-icons/${asset}.webp`;
  return (
    <span
      className="erp-start-emoji"
      ref={ref}
      aria-hidden="true"
      style={{ "--scene-duration": `${duration}ms` } as CSSProperties}
    >
      <img src={src} width={40} height={40} alt="" decoding="async" />
      {scene && <EmojiScene asset={scene} src={src} />}
    </span>
  );
}
