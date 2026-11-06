import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
} from "./product-evidence";

export type MetricScope =
  | { kind: "company"; label: string }
  | { kind: "brand"; label: string; brand: string }
  | { kind: "product"; label: string; brand: string; productId: string };

export type MetricVerification =
  "pending" | "unverified" | "source-observed" | "verified" | "demo";

type CompanyMetricId =
  | "customers"
  | "orders"
  | "brands"
  | "growth"
  | "achievements"
  | "rating"
  | "reviews";

export type MetricRecord = {
  value: string | null;
  unit: string;
  label: string;
  scope: MetricScope;
  period: string | null;
  source: { label: string; reference?: string } | null;
  verification: MetricVerification;
  explanation: string;
};

export type CompanyMetricData = MetricRecord & {
  scope: Extract<MetricScope, { kind: "company" }>;
  id: CompanyMetricId;
  icon:
    | "customers"
    | "orders"
    | "brands"
    | "growth"
    | "trophy"
    | "star"
    | "reviews";
  detail: string;
  methodology: string;
  periodKind: "all-time" | "comparison";
  aggregation?:
    | "deduplicated"
    | "sum"
    | "snapshot"
    | "comparison"
    | "collection"
    | "weighted";
  breakdownLabel?: string;
  yearlyBreakdown?: readonly { year: number; value: string; detail?: string }[];
  brandCounts?: { historical: number | null; active: number | null };
  marketplaceAchievements?: readonly (MetricRecord & {
    scope: Extract<MetricScope, { kind: "brand" }>;
    marketplace: string;
    category: string;
  })[];
};

const companyScope: MetricScope = {
  kind: "company",
  label: "Young Unicorn · Все бренды",
};

// Publish only management-approved, company-wide figures. A missing value is
// intentional: the presentation and product snapshot are not an aggregate feed.
export const companyMetricDefinitions: readonly CompanyMetricData[] = [
  {
    id: "customers",
    periodKind: "all-time",
    icon: "customers",
    value: null,
    unit: "",
    label: "покупателей",
    detail: "за всё время · все бренды",
    aggregation: "deduplicated",
    breakdownLabel: "Новые покупатели по годам",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation:
      "Уникальные покупатели продуктов Young Unicorn по всем брендам и каналам продаж",
    methodology: "Без повторов между брендами и годами",
  },
  {
    id: "orders",
    periodKind: "all-time",
    icon: "orders",
    value: null,
    unit: "",
    label: "заказов",
    detail: "за всё время · все бренды",
    aggregation: "sum",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation:
      "Общее число заказов по всем брендам и каналам продаж Young Unicorn",
    methodology: "Единые правила учёта отмен и возвратов",
  },
  {
    id: "brands",
    periodKind: "all-time",
    icon: "brands",
    value: null,
    unit: "",
    label: "бренда в истории",
    detail: "активные бренды уточняются",
    aggregation: "snapshot",
    breakdownLabel: "Портфель по годам",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    brandCounts: { historical: null, active: null },
    explanation:
      "Все бренды в истории компании и отдельно — бренды, которые активны на отчётную дату",
    methodology: "Активные бренды — на отчётную дату",
  },
  {
    id: "growth",
    periodKind: "comparison",
    icon: "growth",
    value: null,
    unit: "",
    label: "рост выручки",
    detail: "за сопоставимые периоды",
    aggregation: "comparison",
    breakdownLabel: "Рост год к году",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation:
      "Изменение совокупной выручки Young Unicorn за два сопоставимых отчётных периода",
    methodology: "Сравнение сопоставимых полных лет",
  },
  {
    id: "achievements",
    periodKind: "all-time",
    marketplaceAchievements: [],
    icon: "trophy",
    value: null,
    unit: "",
    label: "достижения на маркетплейсах",
    detail: "бренд · категория · период",
    aggregation: "collection",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation:
      "Позиции брендов Young Unicorn в рейтингах маркетплейсов с отдельным учётом каждого достижения",
    methodology: "Позиции сохраняются по брендам и категориям",
  },
  {
    id: "rating",
    periodKind: "all-time",
    icon: "star",
    value: null,
    unit: "",
    label: "средневзвешенный рейтинг",
    detail: "за всё время · все бренды",
    aggregation: "weighted",
    breakdownLabel: "Рейтинг и число оценок по годам",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation:
      "Общий рейтинг продуктов компании, взвешенный по числу оценок каждого продукта",
    methodology: "Вес — число оценок; без дублей карточек",
  },
  {
    id: "reviews",
    periodKind: "all-time",
    icon: "reviews",
    value: null,
    unit: "",
    label: "оценок покупателей",
    detail: "за всё время · все бренды",
    aggregation: "sum",
    scope: companyScope,
    period: null,
    source: null,
    verification: "pending",
    explanation: "Общее число оценок продуктов Young Unicorn по всем брендам",
    methodology: "Оценки; текстовые отзывы считаются отдельно",
  },
];

const demoSource = { label: "Тестовый набор · не отчётность" };
const demoAchievements: NonNullable<
  CompanyMetricData["marketplaceAchievements"]
> = [
  {
    value: "Топ-10",
    unit: "%",
    label: "поставщиков в категории",
    scope: { kind: "brand", label: "Демо-бренд A", brand: "Демо-бренд A" },
    marketplace: "Wildberries",
    category: "Женская одежда",
    period: "2022",
    source: demoSource,
    verification: "demo",
    explanation: "Вымышленный пример для проверки оформления",
  },
  {
    value: "Топ-20",
    unit: "",
    label: "в категории",
    scope: { kind: "brand", label: "Демо-бренд A", brand: "Демо-бренд A" },
    marketplace: "Wildberries",
    category: "Повседневные платья",
    period: "2024",
    source: demoSource,
    verification: "demo",
    explanation: "Вымышленный пример для проверки оформления",
  },
  {
    value: "Топ-50",
    unit: "",
    label: "в категории",
    scope: { kind: "brand", label: "Демо-бренд B", brand: "Демо-бренд B" },
    marketplace: "Ozon",
    category: "Уход за телом",
    period: "2026 · по 02.11",
    source: demoSource,
    verification: "demo",
    explanation: "Вымышленный пример для проверки оформления",
  },
];
// A complete synthetic timeline for design review, never derived from the archive.
// newCustomers are first-time company customers, already deduplicated across brands
// and years. Annual ratings have non-overlapping counts and compatible 1–5 scales.
export const demoYearlyActivity = [
  {
    year: 2020,
    newCustomers: 6000,
    orders: 9000,
    ratings: 2000,
    rating: 4.5,
    historicalBrands: 1,
    activeBrands: 1,
    revenue: 10,
  },
  {
    year: 2021,
    newCustomers: 14000,
    orders: 22000,
    ratings: 8000,
    rating: 4.6,
    historicalBrands: 1,
    activeBrands: 1,
    revenue: 13,
  },
  {
    year: 2022,
    newCustomers: 25000,
    orders: 46000,
    ratings: 15000,
    rating: 4.7,
    historicalBrands: 2,
    activeBrands: 2,
    revenue: 19,
  },
  {
    year: 2023,
    newCustomers: 44000,
    orders: 78000,
    ratings: 30000,
    rating: 4.7,
    historicalBrands: 3,
    activeBrands: 3,
    revenue: 27,
  },
  {
    year: 2024,
    newCustomers: 67000,
    orders: 132000,
    ratings: 52000,
    rating: 4.8,
    historicalBrands: 4,
    activeBrands: 3,
    revenue: 39,
  },
  {
    year: 2025,
    newCustomers: 128000,
    orders: 246000,
    ratings: 118400,
    rating: 4.8,
    historicalBrands: 4,
    activeBrands: 2,
    revenue: 51.48,
  },
  {
    year: 2026,
    newCustomers: 96000,
    orders: 184000,
    ratings: 84600,
    rating: 4.9,
    historicalBrands: 4,
    activeBrands: 2,
    revenue: null,
  },
] as const;
const number = (value: number) => value.toLocaleString("ru-RU");
const sum = (key: "newCustomers" | "orders" | "ratings") =>
  demoYearlyActivity.reduce((total, row) => total + row[key], 0);
const annual = (key: "newCustomers" | "orders" | "ratings") =>
  demoYearlyActivity.map((row) => ({
    year: row.year,
    value: number(row[key]),
    detail: row.year === 2026 ? "по 02.11" : undefined,
  }));
const yearlyGrowth = demoYearlyActivity.map((row, index) => ({
  year: row.year,
  value:
    row.revenue === null
      ? "Год не завершён"
      : index === 0
        ? "Базовый год"
        : `+${Math.round((row.revenue / demoYearlyActivity[index - 1].revenue! - 1) * 100)}%`,
}));
const totalRatings = sum("ratings");
const weightedRating =
  demoYearlyActivity.reduce(
    (total, row) => total + row.rating * row.ratings,
    0,
  ) / totalRatings;
const demoValues: Record<
  CompanyMetricId,
  Partial<CompanyMetricData> & { value: string; unit: string }
> = {
  customers: {
    value: number(sum("newCustomers") / 1000),
    unit: "тыс.",
    yearlyBreakdown: annual("newCustomers"),
  },
  orders: {
    value: number(sum("orders") / 1000),
    unit: "тыс.",
    yearlyBreakdown: annual("orders"),
  },
  brands: {
    value: "4",
    unit: "",
    detail: "2 активных сейчас",
    brandCounts: { historical: 4, active: 2 },
    yearlyBreakdown: demoYearlyActivity.map((row) => ({
      year: row.year,
      value: `${row.historicalBrands} в истории`,
      detail: `${row.activeBrands} ${row.activeBrands === 1 ? "активный" : "активных"}`,
    })),
  },
  growth: {
    value: `+${Math.round((51.48 / 10 - 1) * 100)}`,
    unit: "%",
    period: "2025 к 2020 · полные годы",
    detail: "2025 к 2020 · полные годы",
    methodology: "2026 год ещё не завершён и не включён в сравнение",
    yearlyBreakdown: yearlyGrowth,
  },
  achievements: {
    value: "3",
    unit: "",
    marketplaceAchievements: demoAchievements,
    detail: "за всю историю · 2 бренда",
    yearlyBreakdown: demoYearlyActivity.map((row) => ({
      year: row.year,
      value: String(
        demoAchievements.filter((item) =>
          item.period?.startsWith(String(row.year)),
        ).length,
      ),
    })),
  },
  rating: {
    value: weightedRating.toLocaleString("ru-RU", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    unit: "из 5",
    yearlyBreakdown: demoYearlyActivity.map((row) => ({
      year: row.year,
      value: row.rating.toLocaleString("ru-RU", { minimumFractionDigits: 1 }),
      detail: `${number(row.ratings)} оценок`,
    })),
  },
  reviews: {
    value: number(totalRatings),
    unit: "",
    yearlyBreakdown: annual("ratings"),
  },
};

// Explicitly requested synthetic figures for design review. This switch restores
// the pending prototype without altering approved definitions or source evidence.
export const companyMetricsMode: "demo" | "pending" = "demo";
export const companyMetrics: readonly CompanyMetricData[] =
  companyMetricsMode === "demo"
    ? companyMetricDefinitions.map((metric) => ({
        ...metric,
        ...demoValues[metric.id],
        period: demoValues[metric.id].period ?? "2020–02.11.2026",
        source: demoSource,
        verification: "demo",
      }))
    : companyMetricDefinitions;

export const metricVerificationLabels: Record<MetricVerification, string> = {
  demo: "Демо-данные · Не фактические показатели",
  pending: "Данные на согласовании",
  unverified: "Требует проверки",
  "source-observed": "Зафиксировано в источнике",
  verified: "Данные подтверждены",
};

export function metricDisplayValue(metric: MetricRecord): string {
  return (metric.verification === "verified" ||
    metric.verification === "demo") &&
    metric.value !== null
    ? metric.value
    : "—";
}

export function metricDisplayUnit(metric: MetricRecord): string {
  return (metric.verification === "verified" ||
    metric.verification === "demo") &&
    metric.value !== null
    ? metric.unit
    : "";
}

const presentation = {
  label: "Welcome-презентация Young Unicorn",
};
const product = getProductEvidence("shirt-burgundy-stripe");
const productScope: MetricScope = {
  kind: "product",
  label: "Рубашка в полоску · Enmoone",
  brand: "Enmoone",
  productId: "shirt-burgundy-stripe",
};
const snapshotSource = {
  label: "Снимок Wildberries",
  reference: "src/data/product-evidence.ts",
};

// Archival observations, never inputs to an automatic company-wide total.
// Unknown dates, brands and categories remain null instead of being inferred.
export const historicalMetricSources: readonly (MetricRecord & {
  id: string;
  achievement?: {
    marketplace: string;
    brand: string | null;
    category: string | null;
  };
})[] = [
  {
    id: "presentation-customers",
    value: "2",
    unit: "млн+",
    label: "покупателей",
    scope: companyScope,
    period: null,
    source: presentation,
    verification: "unverified",
    explanation:
      "Историческое заявление; уникальность покупателей и охват всех брендов не подтверждены",
  },
  {
    id: "presentation-orders",
    value: "2,7",
    unit: "млн+",
    label: "заказов на маркетплейсе",
    scope: companyScope,
    period: null,
    source: presentation,
    verification: "unverified",
    explanation:
      "Историческое заявление; отчётный период и полнота охвата требуют проверки",
  },
  {
    id: "presentation-brands",
    value: "3",
    unit: "",
    label: "бренда за весь период работы",
    scope: companyScope,
    period: "За весь период работы до даты презентации; дата не указана",
    source: presentation,
    verification: "unverified",
    explanation:
      "Исторический размер портфеля; не является числом активных брендов на сегодня",
  },
  {
    id: "presentation-turnover-growth",
    value: "50–100",
    unit: "%",
    label: "прирост оборота год к году",
    scope: companyScope,
    period: null,
    source: presentation,
    verification: "unverified",
    explanation:
      "В источнике указан оборот, а не подтверждённая выручка; годы сравнения не приведены",
  },
  {
    id: "presentation-marketplace",
    value: "Топ-5",
    unit: "%",
    label: "поставщиков Wildberries",
    scope: companyScope,
    period: null,
    source: presentation,
    verification: "unverified",
    explanation:
      "Заявление компании; исходный бренд, категория и дата рейтинга не указаны и требуют проверки",
    achievement: { marketplace: "Wildberries", brand: null, category: null },
  },
  {
    id: "enmoone-shirt-rating",
    value: ratingLabel(product.rating),
    unit: "из 5",
    label: "рейтинг рубашки в полоску",
    scope: productScope,
    period: marketplaceSnapshot.dateLabel,
    source: snapshotSource,
    verification: "source-observed",
    explanation:
      "Рейтинг одной карточки товара; не является общим рейтингом компании",
  },
  {
    id: "enmoone-shirt-ratings",
    value: product.ratings.toLocaleString("ru-RU"),
    unit: "",
    label: "оценок рубашки в полоску",
    scope: productScope,
    period: marketplaceSnapshot.dateLabel,
    source: snapshotSource,
    verification: "source-observed",
    explanation:
      "Оценки, не текстовые отзывы; счётчик может быть общим для вариантов карточки",
  },
  {
    id: "enmoone-brand-likes",
    value: marketplaceSnapshot.brandLikes.toLocaleString("ru-RU"),
    unit: "",
    label: "отметок «Нравится» у Enmoone",
    scope: { kind: "brand", label: "Enmoone", brand: "Enmoone" },
    period: marketplaceSnapshot.dateLabel,
    source: snapshotSource,
    verification: "source-observed",
    explanation:
      "Интерес к одному бренду; не оценки, не отзывы и не число покупателей компании",
  },
];
