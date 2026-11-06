import { company } from "./company";
import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
  ratingsLabel,
} from "./product-evidence";

export type CompanySceneKind =
  | "founding"
  | "collection"
  | "assortment"
  | "brand"
  | "scale"
  | "development"
  | "content"
  | "marketing"
  | "feedback";

export type Milestone = {
  year: string;
  label: string;
  title: string;
  text: string;
  scene: CompanySceneKind;
  achievement: { value: string; unit?: string; label: string; text?: boolean };
  facts: string[];
  synthetic?: boolean;
  source?: string;
};

// 2021–2025 are synthetic content requested for the timeline prototype
// Keep their provenance visible; welcome-deck totals are not annual results
export const milestones: Milestone[] = [
  {
    year: company.since,
    label: "Начало истории",
    title: "Основание Young Unicorn",
    text: "История Young Unicorn начинается в российском e-commerce",
    scene: "founding",
    achievement: {
      value: "Основание",
      label: "компании Young Unicorn",
      text: true,
    },
    facts: ["Собственные бренды", "Российский e-commerce"],
  },
  {
    year: "2021",
    label: "Первые коллекции",
    title: "От идеи — к первым покупателям",
    text: "Тестируем первые коллекции на маркетплейсе и уточняем ассортимент по обратной связи покупателей",
    scene: "collection",
    achievement: { value: "15", unit: "тыс", label: "заказов за год" },
    facts: ["40 моделей в ассортименте", "Первые повторные покупки"],
    synthetic: true,
  },
  {
    year: "2022",
    label: "Расширение ассортимента",
    title: "Находим продукты, которые выбирают",
    text: "Расширяем линейку повседневной одежды, выстраиваем работу с производителями и проверяем спрос на новые модели",
    scene: "assortment",
    achievement: { value: "60", unit: "тыс", label: "заказов за год" },
    facts: [
      "120 моделей в ассортименте",
      "Единый процесс работы с поставщиками",
    ],
    synthetic: true,
  },
  {
    year: "2023",
    label: "Развитие бренда",
    title: "Создаём узнаваемый Enmoone",
    text: "Объединяем коллекции общей визуальной подачей, связывая продукт, контент и маркетинг",
    scene: "brand",
    achievement: { value: "180", unit: "тыс", label: "заказов за год" },
    facts: [
      "250 моделей в ассортименте",
      "Собственная система контента для коллекций",
    ],
    synthetic: true,
  },
  {
    year: "2024",
    label: "Масштабирование",
    title: "Растим ассортимент и продажи",
    text: "Увеличиваем объёмы поставок, развиваем аналитику и масштабируем модели с лучшим откликом покупателей",
    scene: "scale",
    achievement: { value: "450", unit: "тыс", label: "заказов за год" },
    facts: [
      "400 моделей в ассортименте",
      "Планирование поставок на основе спроса",
    ],
    synthetic: true,
  },
  {
    year: "2025",
    label: "Новые возможности",
    title: "Готовим следующий этап роста",
    text: "Укрепляем направление одежды и переносим опыт команды в разработку новых категорий ежедневного ухода",
    scene: "development",
    achievement: { value: "900", unit: "тыс", label: "заказов за год" },
    facts: [
      "600 моделей в ассортименте",
      "Первые концепции продуктов self-care и oral care",
    ],
    synthetic: true,
  },
  {
    year: "2026",
    label: "Новый этап",
    title: "Enmoone и новые направления",
    text: "Развиваем Enmoone на Wildberries, готовим self-care и oral care к запуску",
    scene: "feedback",
    achievement: {
      value: ratingLabel(getProductEvidence("shirt-burgundy-stripe").rating),
      unit: "из 5",
      label: "оценка рубашки в полоску",
    },
    facts: [
      `${ratingsLabel(getProductEvidence("shirt-burgundy-stripe").ratings)} у рубашки в полоску`,
      `${marketplaceSnapshot.brandLikes.toLocaleString("ru-RU")} отметок «Нравится» у Enmoone`,
    ],
    source: `Wildberries · снимок от ${marketplaceSnapshot.dateLabel}`,
  },
];
