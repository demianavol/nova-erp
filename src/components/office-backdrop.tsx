import { useEffect, useRef } from "react";

const spacing = 56;
const hoverRadius = 128;
const hoverPush = 10;
const waveRadius = 280;
const waveTravel = 400;
const waveBeat = 280;

type Point = { x: number; y: number };
type Particle = Point & { radius: number; ribbonLight: number };

export function OfficeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ribbonRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !surface || !ctx) return;

    const ribbon = ribbonRef.current;
    const svg = ribbon?.ownerSVGElement;
    const cardStage = surface.querySelector<HTMLElement>(".office-card-stage");
    const positionRibbon = () => {
      if (!ribbon || !svg || !cardStage) return;
      if (cardStage.dataset.request !== "true") {
        ribbon.style.transform = "";
        return;
      }

      const matrix = svg.getScreenCTM();
      if (!matrix?.d) return;
      const bounds = ribbon.getBBox();
      const bottom = svg.getBoundingClientRect().bottom;
      const ribbonTop = matrix.f + bounds.y * matrix.d;
      const top = Math.max(
        cardStage.getBoundingClientRect().bottom + 28,
        Math.min(ribbonTop, bottom - 112),
      );
      const available = Math.max(0, bottom - top - 18);
      const scale = Math.min(1, available / (bounds.height * matrix.d));
      const offset = (top - matrix.f) / matrix.d - bounds.y * scale;
      ribbon.style.transform = `translateY(${offset}px) scaleY(${scale})`;
    };

    const motion = matchMedia("(prefers-reduced-motion: no-preference)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];
    let isDark = false;
    let lastDraw = performance.now();
    let hoverTarget: Point | null = null;
    const hover = { x: 0, y: 0, strength: 0 };
    let wave: (Point & { start: number }) | null = null;

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame((now) => {
        frame = 0;
        draw(now);
      });
    };

    const draw = (now: number) => {
      if (wave && now - wave.start >= waveTravel + waveBeat) wave = null;
      const animate = motion.matches && !document.hidden;
      const elapsed = Math.max(0, Math.min(now - lastDraw, 50));
      const ease = 1 - Math.exp(-elapsed / 75);
      lastDraw = now;
      if (hoverTarget) {
        if (!hover.strength) {
          hover.x = hoverTarget.x;
          hover.y = hoverTarget.y;
        }
        hover.x += (hoverTarget.x - hover.x) * ease;
        hover.y += (hoverTarget.y - hover.y) * ease;
      }
      hover.strength += ((hoverTarget ? 1 : 0) - hover.strength) * ease;
      if (hover.strength < 0.005) hover.strength = 0;

      const ambientPhase = now / 2400;
      const edgeOpacity = isDark ? 0.28 : 0.26;
      const ribbonOpacity = isDark ? 0.26 : 0.32;
      const particleScale = isDark ? 0.8 : 1;
      ctx.clearRect(0, 0, width, height);
      for (const { x, y, radius, ribbonLight } of particles) {
        const dx = x - hover.x;
        const dy = y - hover.y;
        const distance = hover.strength ? Math.hypot(dx, dy) : hoverRadius;
        const near = Math.max(0, 1 - distance / hoverRadius) * hover.strength;
        const push = (hoverPush * near ** 2) / Math.max(17, distance);
        let pulse = 0;
        if (wave) {
          const reach = Math.hypot(x - wave.x, y - wave.y) / waveRadius;
          const phase = (now - wave.start - reach * waveTravel) / waveBeat;
          if (reach < 1 && phase > 0 && phase < 1) {
            pulse = Math.sin(phase * Math.PI) * (1 - reach);
          }
        }
        const shimmer = animate
          ? 0.9 + 0.1 * Math.sin(ambientPhase - x / 160)
          : 1;
        const rest = 1 - pulse;
        const opacity = edgeOpacity + (ribbonOpacity - edgeOpacity) * ribbonLight;
        ctx.globalAlpha = opacity * shimmer + near * 0.34 * rest + pulse * 0.42;
        ctx.beginPath();
        ctx.arc(
          x + dx * push * rest,
          y + dy * push * rest,
          radius * particleScale + near * 0.65 + pulse * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (animate) schedule();
    };

    const repaint = () => {
      isDark = document.documentElement.dataset.siteTheme === "dark";
      ctx.fillStyle = getComputedStyle(canvas).color;
      draw(performance.now());
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = Math.max(1, Math.ceil(width / spacing));
      const rows = Math.max(1, Math.ceil(height / spacing));
      particles = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const seed = row * 47 + column * 23;
          const progress =
            (column + 0.5 + Math.sin(seed * 1.7) * 0.38) / columns;
          const x = progress * width;
          const y = ((row + 0.5 + Math.cos(seed * 2.3) * 0.38) * height) / rows;
          const ribbonY = height * (0.36 + progress * 0.26);
          const ribbonLight = Math.max(
            0,
            1 - Math.abs(y - ribbonY) / (height * 0.27),
          );
          particles.push({
            x,
            y,
            radius: 1.4 + ((row + column * 3) % 5) * 0.18,
            ribbonLight,
          });
        }
      }
      repaint();
    };
    const isBackground = (event: MouseEvent) =>
      event.target instanceof Element &&
      !event.target.closest(".office-card-stage, .office-intro, a, button");
    const locate = ({ clientX, clientY }: MouseEvent): Point => {
      const { left, top } = surface.getBoundingClientRect();
      return { x: clientX - left, y: clientY - top };
    };
    const clearHover = () => {
      hoverTarget = null;
    };
    const onMove = (event: PointerEvent) => {
      if (!motion.matches || event.pointerType !== "mouse") {
        clearHover();
        return;
      }
      hoverTarget = locate(event);
      schedule();
    };
    const onClick = (event: MouseEvent) => {
      if (!motion.matches || !event.detail || !isBackground(event)) return;
      wave = { ...locate(event), start: performance.now() };
      schedule();
    };
    const resetMotion = () => {
      clearHover();
      hover.strength = 0;
      wave = null;
      schedule();
    };

    resize();
    positionRibbon();
    const sizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.target === canvas)) resize();
      positionRibbon();
      if (ribbon) ribbon.dataset.ready = "true";
    });
    sizeObserver.observe(canvas);
    if (cardStage) sizeObserver.observe(cardStage);
    const themeObserver = new MutationObserver(repaint);
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["data-site-theme"],
    });
    motion.addEventListener("change", resetMotion);
    document.addEventListener("visibilitychange", resetMotion);
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerleave", clearHover);
    surface.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", resetMotion);
      document.removeEventListener("visibilitychange", resetMotion);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", clearHover);
      surface.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <svg
        className="office-light"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <path
            id="office-light-path"
            d="M-150 730C200 730 295 580 645 641S1110 815 1590 615"
          />
          <linearGradient
            id="office-light-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="1440"
          >
            <stop offset="0%" stopColor="#7950ce" stopOpacity="0" />
            <stop offset="20%" stopColor="#8963e0" stopOpacity="0.45" />
            <stop
              offset="36%"
              stopColor="var(--office-ribbon-highlight)"
              stopOpacity="0.9"
            />
            <stop offset="58%" stopColor="#8664dc" stopOpacity="0.18" />
            <stop
              offset="79%"
              stopColor="var(--office-ribbon-secondary)"
              stopOpacity="0.58"
            />
            <stop offset="100%" stopColor="#7950ce" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g ref={ribbonRef} className="office-light-ribbon">
          <use href="#office-light-path" className="office-light-haze" />
          <use href="#office-light-path" className="office-light-thread" />
          <use href="#office-light-path" className="office-light-core" />
        </g>
      </svg>
      <canvas className="office-backdrop" ref={canvasRef} aria-hidden="true" />
    </>
  );
}
