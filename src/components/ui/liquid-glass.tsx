import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

type Lens = { url: string; width: number; height: number };

function roundedDistance(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const dx = Math.abs(x) - w / 2 + r;
  const dy = Math.abs(y) - h / 2 + r;
  return (
    Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
    Math.min(Math.max(dx, dy), 0) -
    r
  );
}

function createMap(width: number, height: number, radius: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(width, height);
  const corner = Math.min(radius, width / 2, height / 2);
  const bevel = Math.min(9, corner);
  const distance = (x: number, y: number) =>
    roundedDistance(x, y, width, height, corner);

  // Red and green encode how far to bend the background at the glass rim.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - width / 2;
      const py = y + 0.5 - height / 2;
      const d = distance(px, py);
      const i = (y * width + x) * 4;
      let bend = 0;
      if (d < 0 && d > -bevel) {
        const slope = 1 + d / bevel;
        const angle = Math.atan(slope ** 2 * 3);
        bend = 115 * Math.sin(angle - Math.asin(Math.sin(angle) / 1.5));
      }
      image.data[i] =
        128 - bend * (distance(px + 1, py) - distance(px - 1, py));
      image.data[i + 1] =
        128 - bend * (distance(px, py + 1) - distance(px, py - 1));
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function LiquidGlass({ radius }: { radius: number }) {
  const id = `nova-glass-${useId().replace(/[^a-z0-9_-]/gi, "")}`;
  const surface = useRef<HTMLSpanElement>(null);
  const [lens, setLens] = useState<Lens | null>(null);

  useEffect(() => {
    const element = surface.current;
    if (
      !element ||
      typeof ResizeObserver === "undefined" ||
      !/(?:Chrome|Chromium)\//.test(navigator.userAgent) ||
      !CSS.supports("backdrop-filter", "url(#glass)")
    )
      return;

    const transparency = matchMedia("(prefers-reduced-transparency: reduce)");
    let revision = 0;
    let activeUrl: string | undefined;

    function release() {
      revision++;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
      activeUrl = undefined;
    }

    const observer = new ResizeObserver(() => {
      if (!element || transparency.matches) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (width <= 1 || height <= 1) return;
      const canvas = createMap(width, height, radius);
      const current = ++revision;
      canvas?.toBlob((blob) => {
        if (!blob || current !== revision) return;
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          if (current !== revision) {
            URL.revokeObjectURL(url);
            return;
          }
          if (activeUrl) URL.revokeObjectURL(activeUrl);
          activeUrl = url;
          setLens({ url, width, height });
        };
        image.onerror = () => URL.revokeObjectURL(url);
        image.src = url;
      });
    });

    function update() {
      if (!element) return;
      if (transparency.matches) {
        observer.disconnect();
        release();
        setLens(null);
      } else {
        observer.observe(element);
      }
    }

    update();
    transparency.addEventListener("change", update);
    return () => {
      observer.disconnect();
      transparency.removeEventListener("change", update);
      release();
    };
  }, [radius]);

  return (
    <span
      ref={surface}
      className="liquid-glass"
      aria-hidden="true"
      style={
        lens
          ? ({ "--liquid-refraction": `url("#${id}")` } as CSSProperties)
          : undefined
      }
    >
      {lens && (
        <svg width="0" height="0" focusable="false">
          <defs>
            <filter
              id={id}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
              x={-16}
              y={-16}
              width={lens.width + 32}
              height={lens.height + 32}
            >
              <feImage
                href={lens.url}
                x={0}
                y={0}
                width={lens.width}
                height={lens.height}
                result="rim"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="rim"
                scale={18}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
    </span>
  );
}
