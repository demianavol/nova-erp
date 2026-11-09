export type HistoryMilestoneVisual = {
  metaphor:
    | "foundation"
    | "collection"
    | "package"
    | "transformation"
    | "growth"
    | "expansion"
    | "future";
  label: string;
  /** BASE_URL-relative path to the milestone illustration. */
  asset: string;
};

// Approved artwork, draft visual metaphors: not evidence of company events.
const directory = "media/history-icons/";
export const historyMilestoneVisuals: Record<string, HistoryMilestoneVisual> = {
  "2020": {
    metaphor: "foundation",
    label: "Основание",
    asset: directory + "foundation-cornerstone.webp",
  },
  "2021": {
    metaphor: "collection",
    label: "Коллекция одежды",
    asset: directory + "lavender_glass_t_shirt_icon.webp",
  },
  "2022": {
    metaphor: "package",
    label: "Продукт",
    asset: directory + "translucent_lavender_open_package_box.webp",
  },
  "2023": {
    metaphor: "transformation",
    label: "Преобразование",
    asset: directory + "glossy_lavender_glass_sparkle_icon.webp",
  },
  "2024": {
    metaphor: "growth",
    label: "Рост",
    asset: directory + "glossy_lavender_glass_growth_chart.webp",
  },
  "2025": {
    metaphor: "expansion",
    label: "Новые направления",
    asset: directory + "translucent_lavender_glass_shopping_bag.webp",
  },
  "2026": {
    metaphor: "future",
    label: "Будущее",
    asset: directory + "translucent_lavender_glass_rocket_medallion.webp",
  },
};
