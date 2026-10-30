// Transcribed from the supplied Wildberries snapshot, 2026-10-29.
// These are rating counts, not counts of written reviews or unique buyers.
// Repeated totals can belong to grouped variants; never sum these observations.
export const marketplaceSnapshot = {
  date: "2026-10-29",
  dateLabel: "29.10.2026",
  brand: "Enmoone",
  brandLikes: 3418,
} as const;

const observations: Record<
  string,
  { rating: number; ratings: number; sourceCell: string }
> = {
  "blouse-collar-black": {
    rating: 4.9,
    ratings: 5641,
    sourceCell: "row-1-col-1",
  },
  "blouse-slim-sand": { rating: 4.9, ratings: 198, sourceCell: "row-1-col-2" },
  "shirt-burgundy-stripe": {
    rating: 4.9,
    ratings: 25943,
    sourceCell: "row-1-col-3",
  },
  "dress-evening-sleeves": {
    rating: 4.8,
    ratings: 9336,
    sourceCell: "row-1-col-4",
  },
  "blouse-white-fitted": {
    rating: 4.9,
    ratings: 200,
    sourceCell: "row-1-col-5",
  },
  "shirt-jacket-red": {
    rating: 4.9,
    ratings: 25943,
    sourceCell: "row-2-col-1",
  },
  "polo-trend-yellow": {
    rating: 4.6,
    ratings: 1624,
    sourceCell: "row-2-col-3",
  },
  "shirt-sky-blue": { rating: 4.9, ratings: 25943, sourceCell: "row-2-col-4" },
  "blouse-corset-white": {
    rating: 4.9,
    ratings: 198,
    sourceCell: "row-2-col-5",
  },
  "polo-contrast-white": {
    rating: 4.6,
    ratings: 1624,
    sourceCell: "row-3-col-4",
  },
  "polo-knit-old-money": {
    rating: 4.8,
    ratings: 560,
    sourceCell: "row-6-col-1",
  },
  "dress-black-sheath": {
    rating: 4.8,
    ratings: 9336,
    sourceCell: "row-3-col-5",
  },
  "jeans-baggy-denim": { rating: 4.9, ratings: 87, sourceCell: "row-6-col-2" },
  "sundress-linen-choco": {
    rating: 4.8,
    ratings: 1122,
    sourceCell: "row-4-col-4",
  },
  "trousers-alladin-black": {
    rating: 4.8,
    ratings: 39,
    sourceCell: "row-5-col-4",
  },
  "polo-olive-cropped": { rating: 4.7, ratings: 26, sourceCell: "row-6-col-3" },
  "set-linen-summer": { rating: 4.8, ratings: 345, sourceCell: "row-7-col-4" },
  "jeans-flare-blue": { rating: 4.9, ratings: 87, sourceCell: "row-8-col-2" },
};
export const getProductEvidence = (id: string) => observations[id];
const number = new Intl.NumberFormat("ru-RU");
const plural = new Intl.PluralRules("ru-RU");
export const ratingsLabel = (count: number) =>
  `${number.format(count)} ${{ one: "оценка", few: "оценки", many: "оценок", other: "оценки", zero: "оценок", two: "оценки" }[plural.select(count)]}`;
export const ratingLabel = (rating: number) =>
  rating.toLocaleString("ru-RU", { minimumFractionDigits: 1 });
