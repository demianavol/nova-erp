import { milestones } from "./company-history";
import { historyMilestoneVisuals } from "./history-milestone-visuals";
import {
  historyPhotographs,
  historyPhotoCollections,
} from "./history-photographs";
import { historyEditorialCopy } from "./history-editorial-copy";
import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
  ratingsLabel,
} from "./product-evidence";

export type JourneyVisual = {
  asset: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  treatment: "founding" | "product" | "brand" | "editorial";
  position?: string;
};

export type JourneyStep = {
  year: string;
  label: string;
  title: string;
  description: string;
  visual: JourneyVisual;
  status: "draft" | "source-observed";
  source?: string;
  proof?: {
    value: string;
    label: string;
    scope: "company" | "brand" | "product";
    source: string;
  };
};

// Existing images illustrate the draft narrative; they are not dated archival
// photographs. Management can replace the visual and copy for each year here.
const visuals: Record<string, JourneyVisual> = {
  "2020": {
    asset: "glass-purple.webp",
    alt: "Фиолетовый стеклянный объект из визуальной системы Young Unicorn",
    caption: "Идея обретает форму",
    width: 720,
    height: 720,
    treatment: "founding",
  },
  "2021": {
    asset: "products/blouse-slim-sand.webp",
    alt: "Деталь повседневной блузки Enmoone",
    caption: "Первые коллекции · Визуальный пример",
    width: 300,
    height: 390,
    treatment: "product",
  },
  "2022": {
    asset: "products/shirt-sky-blue.webp",
    alt: "Голубая рубашка из ассортимента Enmoone",
    caption: "Ассортимент · Визуальный пример",
    width: 300,
    height: 390,
    treatment: "product",
  },
  "2023": {
    asset: "enmoone-hero-poster.webp",
    alt: "Модель в белой блузке Enmoone в тёплом архитектурном пространстве",
    caption: "Enmoone · Визуальный язык бренда",
    width: 1280,
    height: 720,
    treatment: "brand",
    position: "65% center",
  },
  "2024": {
    asset: "fashion-editorial.webp",
    alt: "Редакционный образ направления одежды",
    caption: "Коллекции · Визуальная концепция",
    width: 1536,
    height: 1024,
    treatment: "editorial",
    position: "45% center",
  },
  "2025": {
    asset: "selfcare-editorial.webp",
    alt: "Концепция продуктов для ежедневного ухода",
    caption: "Self-care · Визуальная концепция",
    width: 1536,
    height: 1024,
    treatment: "editorial",
  },
  "2026": {
    asset: "products/shirt-burgundy-stripe.webp",
    alt: "Рубашка Enmoone в бордовую полоску",
    caption: "Продукт Enmoone · Обратная связь покупателей",
    width: 300,
    height: 390,
    treatment: "product",
  },
};
const product = getProductEvidence("shirt-burgundy-stripe");

export const companyJourney: readonly JourneyStep[] = milestones.map(
  (item) => ({
    year: item.year,
    label: item.label,
    title: item.title,
    description: item.text.replaceAll("e-commerce", "e‑commerce"),
    visual: visuals[item.year],
    status: item.synthetic ? "draft" : "source-observed",
    source:
      item.source ??
      (item.synthetic ? undefined : "Welcome-материалы Young Unicorn"),
    // Keep the existing evidence attached to its product, not the entire company.
    ...(item.year === "2026"
      ? {
          proof: {
            value: `${ratingLabel(product.rating)} из 5`,
            label: `Рубашка Enmoone · ${ratingsLabel(product.ratings)}`,
            scope: "product" as const,
            source: `Wildberries · ${marketplaceSnapshot.dateLabel}`,
          },
        }
      : {}),
  }),
);

export const companyHistoryInfographic = companyJourney.map((step) => ({
  year: step.year,
  stageLabel: step.label,
  headline: historyEditorialCopy[step.year].title,
  description: historyEditorialCopy[step.year].description,
  fullHeadline: step.title,
  fullDescription: step.description,
  visualAsset: step.visual,
  milestoneVisual: historyMilestoneVisuals[step.year],
  photograph: historyPhotographs[step.year],
  photographs: historyPhotoCollections[step.year],
  achievement: step.proof,
  source: step.source,
  verificationStatus: step.status,
}));
