import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowUpRight } from "lucide-react";
import { useSiteLanguage } from "../lib/site-language";
import { companyPartnership as content } from "../data/company-partnership";
import {
  mountPartnershipInvitation,
  type InvitationState,
} from "./partnership-invitation";
import "../company-partnership.css";
import { invitationPocketPath } from "./partnership-invitation-geometry";

const Silk = lazy(() => import("./react-bits/Silk"));

export function CompanyPartnership() {
  const { t } = useSiteLanguage();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<
    typeof mountPartnershipInvitation
  > | null>(null);
  const [state, setState] = useState<InvitationState>("closed");
  useLayoutEffect(() => {
    if (state !== "opening" && state !== "closing") return;
    document.documentElement.classList.add("yu-invitation-transition");
    return () =>
      document.documentElement.classList.remove("yu-invitation-transition");
  }, [state]);
  const letterId = useId();
  const svgId = useId().replace(/:/g, "");
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.siteTheme === "dark",
  );

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(motion.matches);
    const theme = new MutationObserver(() =>
      setDark(document.documentElement.dataset.siteTheme === "dark"),
    );
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-site-theme"],
    });
    const view = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setInView(visible);
        if (visible) setNear(true);
      },
      { rootMargin: "200px" },
    );
    if (root.current) view.observe(root.current);
    motion.addEventListener("change", change);
    return () => {
      motion.removeEventListener("change", change);
      theme.disconnect();
      view.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    controller.current = mountPartnershipInvitation(
      {
        stage: el,
        layers: [
          ...el.querySelectorAll<HTMLElement>(".invitation-envelope-layer"),
        ],
        flap: el.querySelector<HTMLElement>(".invitation-flap")!,
        hinge: el.querySelector<HTMLElement>(".invitation-hinge")!,
        letter: el.querySelector<HTMLElement>(".invitation-letter")!,
        sleeve: el.querySelector<HTMLElement>(".invitation-letter-sleeve")!,
        copy: el.querySelector<HTMLElement>(".invitation-letter-copy")!,
        trigger: el.querySelector<HTMLButtonElement>(".invitation-trigger")!,
        heading: el.querySelector<HTMLElement>("h2")!,
      },
      matchMedia("(prefers-reduced-motion: reduce)"),
      setState,
    );
    return () => {
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  return (
    <section
      ref={root}
      id="contacts"
      className="company-partnership"
      data-invitation={state}
      data-in-view={inView}
      aria-label={t(content.eyebrow)}
      tabIndex={-1}
    >
      <div className="partnership-atmosphere" aria-hidden="true">
        {near && !reduced && (
          <Suspense fallback={null}>
            <Silk
              className="partnership-silk"
              color={dark ? "#77509c" : "#d9c9ec"}
              sheenColor={dark ? "#dec1fa" : "#ffffff"}
              lightMode={!dark}
              speed={1.5}
              scale={0.85}
              rotation={0.25}
              sheen={0.22}
              depth={0.45}
              glow={0.12}
              noiseIntensity={0.1}
              frozen={state !== "closed"}
              interactionStrength={0.5}
              mouseInteraction
              clickRipple={false}
              intro={false}
              fade={0.5}
              dpr={1}
            />
          </Suspense>
        )}
      </div>
      <div className="lp-container partnership-layout">
        <p className="partnership-eyebrow">
          <span aria-hidden="true" />
          {t(content.eyebrow)}
        </p>
        <div ref={stage} className="invitation-stage" data-state={state}>
          <svg
            className="invitation-definitions"
            aria-hidden="true"
            width="0"
            height="0"
          >
            <defs>
              <linearGradient id={`${svgId}-rear`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#eee0ff" stopOpacity=".78" />
                <stop offset=".5" stopColor="#8d5cc1" stopOpacity=".5" />
                <stop offset="1" stopColor="#d1adf1" stopOpacity=".85" />
              </linearGradient>
              <linearGradient
                id={`${svgId}-glass`}
                x1=".05"
                y1="0"
                x2=".85"
                y2="1"
              >
                <stop stopColor="#f9f1ff" stopOpacity=".91" />
                <stop offset=".22" stopColor="#c89bed" stopOpacity=".58" />
                <stop offset=".58" stopColor="#9971bc" stopOpacity=".28" />
                <stop offset="1" stopColor="#e9ceff" stopOpacity=".92" />
              </linearGradient>
              <linearGradient id={`${svgId}-edge`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#fff" />
                <stop offset=".4" stopColor="#d3a3ff" />
                <stop offset=".7" stopColor="#c79de5" />
                <stop offset="1" stopColor="#fff" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="invitation-envelope-layer invitation-rear"
            aria-hidden="true"
          >
            <svg viewBox="0 0 640 372" fill="none">
              <rect
                x="2"
                y="2"
                width="636"
                height="368"
                rx="28"
                fill={`url(#${svgId}-rear)`}
                stroke={`url(#${svgId}-edge)`}
                strokeWidth="2"
              />
              <rect
                x="7"
                y="7"
                width="626"
                height="358"
                rx="23"
                stroke="#ead8ff"
                strokeOpacity=".5"
              />
            </svg>
          </div>
          <div className="invitation-letter-sleeve">
            <article
              id={letterId}
              className="invitation-letter"
              aria-hidden="true"
              inert
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  controller.current?.command("close");
                }
              }}
            >
              <div className="invitation-letter-copy">
                <p className="invitation-letter-label">{t(content.letterLabel)}</p>
                <h2 id="partnership-title" tabIndex={-1}>
                  {t(content.title)}
                </h2>
                <p className="invitation-opening">{t(content.opening)}</p>
                <p className="invitation-description">{t(content.description)}</p>
                <div className="invitation-letter-actions">
                  <a
                    className="partnership-cta"
                    href={content.contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(content.action)}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    className="invitation-close"
                    onClick={() => controller.current?.command("close")}
                  >
                    {t(content.close)}
                    <span aria-hidden="true">↑</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div
            className="invitation-envelope-layer invitation-pocket"
            aria-hidden="true"
          >
            <svg viewBox="0 0 640 372" fill="none">
              <path
                d={invitationPocketPath}
                fill={`url(#${svgId}-glass)`}
                stroke={`url(#${svgId}-edge)`}
                strokeWidth="2"
              />
              <path
                d="m8 345 244-174m380 174L388 171"
                stroke="#f4deff"
                strokeOpacity=".6"
                strokeWidth="1.3"
              />
              <path
                d="M8 349q0 14 20 14h584q20 0 20-14"
                stroke="#fff"
                strokeOpacity=".5"
              />
            </svg>
          </div>
          <div
            className="invitation-envelope-layer invitation-flap"
            aria-hidden="true"
          >
            <div className="invitation-hinge">
              <svg viewBox="0 0 640 232" fill="none">
                <path
                  d="M3 27Q3 3 28 3H612Q637 3 637 27L346 220Q320 237 294 220Z"
                  fill={`url(#${svgId}-glass)`}
                  stroke={`url(#${svgId}-edge)`}
                  strokeWidth="2.5"
                />
                <path
                  d="M12 28Q12 11 30 11H610Q628 11 628 28L342 213Q320 228 298 213Z"
                  stroke="#fff"
                  strokeOpacity=".3"
                />
              </svg>
              <span
                className="invitation-seal"
                style={{
                  maskImage: `url("${import.meta.env.BASE_URL}yuc-mark.svg")`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            className="invitation-trigger"
            aria-expanded="false"
            aria-controls={letterId}
            onClick={() => controller.current?.command("open")}
          >
            <span className="invitation-address">
              <span>{t(content.invitation[0])}</span>
              <strong>{t(content.invitation[1])}</strong>
            </span>
            <span className="invitation-open-hint">
              {t(content.open)}
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
