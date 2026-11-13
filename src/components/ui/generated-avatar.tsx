// Face generation and SVG geometry adapted from the supplied Avatar Picker by @dorianbaffier.
type RGB = readonly [number, number, number];

const BACKGROUNDS: readonly { name: string; rgb: RGB }[] = [
  { name: "gray", rgb: [228, 228, 231] },
  { name: "sand", rgb: [233, 226, 214] },
  { name: "sage", rgb: [217, 225, 213] },
  { name: "slate", rgb: [218, 225, 233] },
  { name: "clay", rgb: [235, 221, 214] },
  { name: "mist", rgb: [226, 223, 233] },
];
const SKINS: readonly RGB[] = [
  [246, 233, 222],
  [236, 210, 187],
  [214, 176, 142],
  [176, 128, 96],
  [128, 88, 66],
];
const HAIRS: readonly RGB[] = [
  [39, 39, 42],
  [63, 45, 36],
  [113, 84, 62],
  [161, 161, 170],
  [82, 82, 91],
];
const SHIRTS: readonly RGB[] = [
  [39, 39, 42],
  [82, 82, 91],
  [113, 113, 122],
  [244, 244, 245],
];
const INK = "#18181b";

const SHAPE_KEYS = [
  "headW",
  "headH",
  "headSquare",
  "chin",
  "hairVolume",
  "hairFringe",
  "hairPart",
  "hairLength",
  "eyeGap",
  "eyeY",
  "eyeRx",
  "eyeRy",
  "browTilt",
  "browLift",
  "browWeight",
  "mouthW",
  "mouthCurve",
  "mouthOpen",
  "nose",
  "glasses",
  "cheeks",
  "shoulders",
] as const;

type ShapeKey = (typeof SHAPE_KEYS)[number];

interface Face {
  shape: Record<ShapeKey, number>;
  bg: RGB;
  skin: RGB;
  hair: RGB;
  shirt: RGB;
}

function hashString(input: string) {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const round2 = (v: number) => Math.round(v * 100) / 100;

function pick<T>(list: readonly T[], r: number): T {
  return list[Math.min(list.length - 1, Math.floor(r * list.length))] as T;
}

/** Deterministic face for a seed. Same seed, same face, server and client. */
function createFace(seed: string): Face {
  const r = mulberry32(hashString(seed));
  const bg = pick(BACKGROUNDS, r());
  const shape: Face["shape"] = {
    headW: 18 + r() * 5,
    headH: 22 + r() * 4,
    headSquare: r(),
    chin: 0.75 + r() * 0.25,
    hairVolume: r(),
    hairFringe: r(),
    hairPart: r() * 2 - 1,
    hairLength: r() ** 1.6,
    eyeGap: 7.5 + r() * 3,
    eyeY: -2 + r() * 4,
    eyeRx: 1.7 + r() * 0.9,
    eyeRy: 1.9 + r() * 1.4,
    browTilt: -2 + r() * 4,
    browLift: 4.2 + r() * 2,
    browWeight: r() < 0.65 ? 1.3 + r() * 0.8 : 0,
    mouthW: 3.5 + r() * 3,
    mouthCurve: r() * 4.5,
    mouthOpen: r() < 0.3 ? 0.6 + r() * 0.4 : 0,
    nose: r(),
    glasses: r() < 0.25 ? 1 : 0,
    cheeks: r(),
    shoulders: r(),
  };
  for (const key of SHAPE_KEYS) {
    shape[key] = round2(shape[key]);
  }
  return {
    shape,
    bg: bg.rgb,
    skin: pick(SKINS, r()),
    hair: pick(HAIRS, r()),
    shirt: pick(SHIRTS, r()),
  };
}

const rgb = (c: RGB, k = 1) =>
  `rgb(${Math.round(c[0] * k)} ${Math.round(c[1] * k)} ${Math.round(c[2] * k)})`;

const n = round2;

/** Rounded blob: `square` blends between an ellipse and a squircle. */
function blobPath(
  cx: number,
  cy: number,
  w: number,
  top: number,
  bottom: number,
  square: number,
  chin = 1,
) {
  const k = 0.552 + square * 0.28;
  const kb = k * chin;
  return [
    `M${n(cx)} ${n(cy - top)}`,
    `C${n(cx + k * w)} ${n(cy - top)} ${n(cx + w)} ${n(cy - k * top)} ${n(cx + w)} ${n(cy)}`,
    `C${n(cx + w)} ${n(cy + kb * bottom)} ${n(cx + kb * w)} ${n(cy + bottom)} ${n(cx)} ${n(cy + bottom)}`,
    `C${n(cx - kb * w)} ${n(cy + bottom)} ${n(cx - w)} ${n(cy + kb * bottom)} ${n(cx - w)} ${n(cy)}`,
    `C${n(cx - w)} ${n(cy - k * top)} ${n(cx - k * w)} ${n(cy - top)} ${n(cx)} ${n(cy - top)}Z`,
  ].join("");
}

function hairFrontPath(s: Face["shape"], cx: number, cy: number) {
  const w = s.headW;
  const h = s.headH;
  const v = s.hairVolume;
  const temple = cy - h * 0.12;
  const crown = cy - h - 1.5 - v * 4;
  const side = w + 1.5 + v * 2.5;
  const k = 0.552 + s.headSquare * 0.28;
  const fringeY = cy - h * (0.66 - s.hairFringe * 0.36);
  const partX = cx + s.hairPart * w * 0.55;
  return [
    `M${n(cx - side)} ${n(temple)}`,
    `C${n(cx - side)} ${n(cy - h * k - v * 3)} ${n(cx - k * side)} ${n(crown)} ${n(cx)} ${n(crown)}`,
    `C${n(cx + k * side)} ${n(crown)} ${n(cx + side)} ${n(cy - h * k - v * 3)} ${n(cx + side)} ${n(temple)}`,
    `L${n(cx + w - 1)} ${n(temple)}`,
    `Q${n(cx + w * 0.75)} ${n(fringeY + 1 - s.hairPart * 5)} ${n(partX)} ${n(fringeY - 2.5)}`,
    `Q${n(cx - w * 0.75)} ${n(fringeY + 1 + s.hairPart * 5)} ${n(cx - w + 1)} ${n(temple)}Z`,
  ].join("");
}

function mouthPath(s: Face["shape"], cx: number, y: number) {
  const curve = s.mouthCurve * 2;
  const open = s.mouthOpen * 5;
  return [
    `M${n(cx - s.mouthW)} ${n(y)}`,
    `Q${n(cx)} ${n(y + curve)} ${n(cx + s.mouthW)} ${n(y)}`,
    `Q${n(cx)} ${n(y + curve + open)} ${n(cx - s.mouthW)} ${n(y)}Z`,
  ].join("");
}

/** The face itself: one SVG, 100×100 units, every number rounded. */
export function GeneratedAvatar({ seed }: { seed: string }) {
  const face = createFace(seed);
  const s = face.shape;
  const cx = 50;
  const cy = 50;
  const eyeY = cy + s.eyeY;
  const mouthY = cy + s.headH * 0.5;
  const glassR = Math.max(s.eyeRx, s.eyeRy) + 3.2;
  const neckTop = cy + s.headH - 6;
  const shoulderTop = cy + s.headH + 3;
  const sw = 30 + s.shoulders * 8;

  return (
    <svg
      aria-hidden="true"
      className="nova-generated-avatar"
      viewBox="12 14 76 76"
    >
      <rect fill={rgb(face.bg)} height="100" width="100" />
      {/* Long hair sits behind the head. */}
      <path
        d={blobPath(
          cx,
          cy - s.headH * 0.15,
          s.headW + 1 + s.hairVolume * 2.5,
          s.headH * 0.85 + s.hairVolume * 4,
          s.headH * 0.15 + s.hairLength * (s.headH + 14),
          s.headSquare * 0.6,
        )}
        fill={rgb(face.hair, 0.9)}
      />
      <path
        d={`M${n(cx - sw)} 100C${n(cx - sw)} ${n(shoulderTop + 6)} ${n(cx - sw * 0.55)} ${n(shoulderTop)} ${cx} ${n(shoulderTop)}C${n(cx + sw * 0.55)} ${n(shoulderTop)} ${n(cx + sw)} ${n(shoulderTop + 6)} ${n(cx + sw)} 100Z`}
        fill={rgb(face.shirt)}
      />
      <rect
        fill={rgb(face.skin, 0.9)}
        height={n(shoulderTop - neckTop + 3)}
        rx="3"
        width="12"
        x={cx - 6}
        y={n(neckTop)}
      />
      <ellipse
        cx={n(cx - s.headW)}
        cy={n(cy + 2)}
        fill={rgb(face.skin, 0.95)}
        rx="3"
        ry="4.5"
      />
      <ellipse
        cx={n(cx + s.headW)}
        cy={n(cy + 2)}
        fill={rgb(face.skin, 0.95)}
        rx="3"
        ry="4.5"
      />
      <path
        d={blobPath(cx, cy, s.headW, s.headH, s.headH, s.headSquare, s.chin)}
        fill={rgb(face.skin)}
      />
      <path d={hairFrontPath(s, cx, cy)} fill={rgb(face.hair)} />
      <g fill={INK} opacity={n(0.045 * s.cheeks)}>
        <circle cx={n(cx - s.eyeGap - 3)} cy={n(eyeY + 7)} r="3.4" />
        <circle cx={n(cx + s.eyeGap + 3)} cy={n(eyeY + 7)} r="3.4" />
      </g>
      <g
        stroke={INK}
        strokeLinecap="round"
        strokeOpacity="0.85"
        strokeWidth={n(Math.max(0, s.browWeight))}
      >
        <path
          d={`M${n(cx - s.eyeGap - 3.2)} ${n(eyeY - s.browLift + s.browTilt)}L${n(cx - s.eyeGap + 3.2)} ${n(eyeY - s.browLift - s.browTilt)}`}
        />
        <path
          d={`M${n(cx + s.eyeGap - 3.2)} ${n(eyeY - s.browLift - s.browTilt)}L${n(cx + s.eyeGap + 3.2)} ${n(eyeY - s.browLift + s.browTilt)}`}
        />
      </g>
      <g>
        <g
          className="transition-transform duration-75 ease-out"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <ellipse
            cx={n(cx - s.eyeGap)}
            cy={n(eyeY)}
            fill={INK}
            rx={n(s.eyeRx)}
            ry={n(s.eyeRy)}
          />
          <ellipse
            cx={n(cx + s.eyeGap)}
            cy={n(eyeY)}
            fill={INK}
            rx={n(s.eyeRx)}
            ry={n(s.eyeRy)}
          />
        </g>
      </g>
      <path
        d={`M${n(cx - 1.5 - s.nose)} ${n(eyeY + 8 + s.nose * 1.5)}Q${cx} ${n(eyeY + 9.5 + s.nose * 1.5)} ${n(cx + 1.5 + s.nose)} ${n(eyeY + 8 + s.nose * 1.5)}`}
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <path
        d={mouthPath(s, cx, mouthY)}
        fill={INK}
        stroke={INK}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <g
        fill="none"
        opacity={n(Math.max(0, Math.min(1, s.glasses)))}
        stroke={INK}
        strokeWidth="1.2"
      >
        <circle cx={n(cx - s.eyeGap)} cy={n(eyeY)} r={n(glassR)} />
        <circle cx={n(cx + s.eyeGap)} cy={n(eyeY)} r={n(glassR)} />
        <path
          d={`M${n(cx - s.eyeGap + glassR)} ${n(eyeY)}Q${cx} ${n(eyeY - 2)} ${n(cx + s.eyeGap - glassR)} ${n(eyeY)}`}
        />
      </g>
    </svg>
  );
}
