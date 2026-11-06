export type HistoryPhotograph = {
  asset: string | null;
  alt: string;
  caption: string;
  source?: string;
  verification: "pending" | "example" | "verified";
  position?: string;
};

// Explicit examples requested for the prototype, NOT dated company archive.
// Replace each example with an approved photograph, caption and source, then
// change verification to "verified". Never infer historical provenance by year.
const examples = [
  [
    "2020",
    "enmoone-hero-poster.webp",
    "Редакционный образ Enmoone",
    "65% center",
  ],
  ["2021", "products/blouse-slim-sand.webp", "Блузка Enmoone", "center 30%"],
  ["2022", "products/shirt-sky-blue.webp", "Рубашка Enmoone", "center 30%"],
  [
    "2023",
    "products/set-linen-summer.webp",
    "Летняя коллекция Enmoone",
    "center 30%",
  ],
  [
    "2024",
    "fashion-editorial.webp",
    "Редакционный образ направления одежды",
    "center 35%",
  ],
  [
    "2025",
    "selfcare-editorial.webp",
    "Визуальная концепция ухода за собой",
    "center",
  ],
  [
    "2026",
    "oralcare-editorial.webp",
    "Визуальная концепция oral care",
    "center",
  ],
];
export const historyPhotographs: Record<string, HistoryPhotograph> =
  Object.fromEntries(
    examples.map(([year, file, label, position]) => [
      year,
      {
        asset: `brand/${file}`,
        alt: `${label} · Пример фото, не исторический архив`,
        caption: `${label}. Визуальный пример для макета, не архивная фотография ${year} года.`,
        source: "Материалы текущего сайта · Демонстрационный пример",
        verification: "example" as const,
        position,
      },
    ]),
  );

export type HistoryPhotoVariant = "main" | "wide" | "portrait";
export type HistoryPhotoPlacement = {
  left: number;
  bottom: number;
  angle: number;
  aspect?: string;
};
// Counts/layouts are visual composition, never historical archive quantities.
const layouts: Record<
  string,
  { show: HistoryPhotoVariant[]; placements: HistoryPhotoPlacement[] }
> = {
  "2020": {
    show: ["main"],
    placements: [
      { left: 40, bottom: 38, angle: -6, aspect: "3/2" },
      { left: 170, bottom: 78, angle: 6 },
      { left: 290, bottom: 30, angle: -8 },
    ],
  },
  "2021": {
    show: ["main", "wide"],
    placements: [
      { left: 8, bottom: 34, angle: -5, aspect: "1/1" },
      { left: 196, bottom: 82, angle: 7 },
      { left: 290, bottom: 28, angle: -5 },
    ],
  },
  "2022": {
    show: ["main", "wide", "portrait"],
    placements: [
      { left: 24, bottom: 32, angle: 3, aspect: "4/3" },
      { left: 182, bottom: 114, angle: -7 },
      { left: 300, bottom: 24, angle: 7 },
    ],
  },
  "2023": {
    show: ["main", "portrait"],
    placements: [
      { left: 52, bottom: 40, angle: -3, aspect: "3/2" },
      { left: 170, bottom: 90, angle: 5 },
      { left: 270, bottom: 42, angle: -9 },
    ],
  },
  "2024": {
    show: ["main", "wide", "portrait"],
    placements: [
      { left: 8, bottom: 34, angle: -4, aspect: "4/3" },
      { left: 158, bottom: 86, angle: 5 },
      { left: 300, bottom: 32, angle: -8 },
    ],
  },
  "2025": {
    show: ["main", "portrait"],
    placements: [
      { left: 12, bottom: 32, angle: -6, aspect: "1/1" },
      { left: 154, bottom: 90, angle: 6 },
      { left: 248, bottom: 46, angle: 8 },
    ],
  },
  "2026": {
    show: ["main", "wide"],
    placements: [
      { left: 80, bottom: 32, angle: 4, aspect: "3/2" },
      { left: 232, bottom: 100, angle: -6 },
      { left: 310, bottom: 24, angle: -7 },
    ],
  },
};
const previewPool = Object.values(historyPhotographs);
export const historyPhotoCollections: Record<
  string,
  {
    variant: HistoryPhotoVariant;
    photograph: HistoryPhotograph;
    placement: HistoryPhotoPlacement;
    visible: boolean;
  }[]
> = Object.fromEntries(
  Object.entries(historyPhotographs).map(([year, photograph], index) => [
    year,
    (["main", "wide", "portrait"] as const).map((variant, offset) => ({
      variant,
      photograph:
        offset === 0
          ? photograph
          : {
              ...previewPool[(index + offset) % previewPool.length],
              verification: "example" as const,
              caption: `Визуальный пример к этапу ${year}. Не архивная фотография компании.`,
            },
      placement: layouts[year].placements[offset],
      visible: layouts[year].show.includes(variant),
    })),
  ]),
);
