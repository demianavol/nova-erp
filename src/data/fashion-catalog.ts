export interface CatalogProduct {
  id: string;
  title: string;
  category: "all" | "shirts" | "polo" | "dresses" | "bottoms" | "sets";
  categoryLabel: string;
  badge?: string;
  fabric: string;
  description: string;
  image: string;
  alt: string;
}

export const catalogCategories = [
  { id: "all", label: "Все товары" },
  { id: "shirts", label: "Рубашки и блузки" },
  { id: "polo", label: "Поло и топы" },
  { id: "dresses", label: "Платья и сарафаны" },
  { id: "bottoms", label: "Джинсы и брюки" },
  { id: "sets", label: "Комплекты" },
] as const;

export type CatalogCategoryId = (typeof catalogCategories)[number]["id"];

export const fashionProducts: CatalogProduct[] = [
  {
    id: "blouse-collar-black",
    title: "Рубашка-блузка с воротником-стойкой",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Хит продаж",
    fabric: "Плотный хлопок",
    description:
      "Офисная сорочка с акцентными оборками на планке и воротнике-стойке, пышные манжеты на пуговицах.",
    image: "products/blouse-collar-black.webp",
    alt: "Черная рубашка-блузка Enmoone с воротником-стойкой и оборками",
  },
  {
    id: "blouse-slim-sand",
    title: "Рубашка-блузка приталенная",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Базовый гардероб",
    fabric: "Хлопковый поплин",
    description:
      "Благородный оттенок кофе с молоком и силуэтные вытачки для идеальной посадки по фигуре.",
    image: "products/blouse-slim-sand.webp",
    alt: "Песочно-кофейная приталенная блузка Enmoone",
  },
  {
    id: "shirt-burgundy-stripe",
    title: "Рубашка в полоску офисная базовая",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Деловой стиль",
    fabric: "Бордовая полоска",
    description:
      "Классическая сорочка свободного кроя в графичную тонкую полоску для капсульных деловых образов.",
    image: "products/shirt-burgundy-stripe.webp",
    alt: "Бордовая рубашка в полоску Enmoone",
  },
  {
    id: "dress-evening-sleeves",
    title: "Платье-футляр с прозрачными рукавами",
    category: "dresses",
    categoryLabel: "Платья и сарафаны",
    badge: "Вечерняя линия",
    fabric: "Костюмная ткань · органза",
    description:
      "Элегантное черное платье миди с фирменным логотипом Enmoone и акцентными рукавами-колокол из органзы.",
    image: "products/dress-evening-sleeves.webp",
    alt: "Черное вечернее платье-футляр Enmoone с прозрачными рукавами",
  },
  {
    id: "blouse-white-fitted",
    title: "Рубашка-блузка приталенная белая",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Бестселлер",
    fabric: "Премиальный хлопок",
    description:
      "Белоснежная строгая сорочка с отложным воротником, чистыми линиями швов и комфортной посадкой.",
    image: "products/blouse-white-fitted.webp",
    alt: "Белая приталенная сорочка Enmoone",
  },
  {
    id: "shirt-jacket-red",
    title: "Рубашка-жакет акцентная",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Акцентный цвет",
    fabric: "Плотный твил",
    description:
      "Алая рубашка прямого кроя, выступающая акцентным верхним слоем поверх базовых топов.",
    image: "products/shirt-jacket-red.webp",
    alt: "Красная рубашка-жакет Enmoone",
  },
  {
    id: "polo-trend-yellow",
    title: "Футболка поло оверсайз базовая",
    category: "polo",
    categoryLabel: "Поло и топы",
    badge: "Trend 2026",
    fabric: "Хлопковое пике",
    description:
      "Песочно-пастельное поло оверсайз с отложным воротником и спущенной линией плеча в эстетике 2026.",
    image: "products/polo-trend-yellow.webp",
    alt: "Песочная футболка поло оверсайз Enmoone Trend 2026",
  },
  {
    id: "shirt-sky-blue",
    title: "Рубашка-блузка небесно-голубая",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Капсула",
    fabric: "100% Хлопок",
    description:
      "Классическая небесно-голубая сорочка свободного силуэта для офисных и повседневных сочетаний.",
    image: "products/shirt-sky-blue.webp",
    alt: "Голубая офисная рубашка Enmoone",
  },
  {
    id: "blouse-corset-white",
    title: "Рубашка-блузка с корсетным силуэтом",
    category: "shirts",
    categoryLabel: "Рубашки и блузки",
    badge: "Корсетный крой",
    fabric: "Хлопок стрейч",
    description:
      "Белая приталенная блузка с корсетными завязками на талии, формирующими утонченный силуэт «песочные часы».",
    image: "products/blouse-corset-white.webp",
    alt: "Белая блузка Enmoone с корсетными завязками",
  },
  {
    id: "polo-contrast-white",
    title: "Футболка поло с контрастным воротником",
    category: "polo",
    categoryLabel: "Поло и топы",
    badge: "Trend 2026",
    fabric: "Плотный трикотаж",
    description:
      "Белоснежное поло прямого кроя с графичным черным отложным воротником и планкой.",
    image: "products/polo-contrast-white.webp",
    alt: "Белое поло Enmoone с контрастным черным воротником",
  },
  {
    id: "polo-knit-old-money",
    title: "Футболка поло вязаная Old Money",
    category: "polo",
    categoryLabel: "Поло и топы",
    badge: "Old Money",
    fabric: "Фактурная вязка",
    description:
      "Вязаное трикотажное поло мелкой фактурной вязки в песочно-бежевой гамме тихой роскоши.",
    image: "products/polo-knit-old-money.webp",
    alt: "Вязаное бежевое поло Enmoone Old Money",
  },
  {
    id: "dress-black-sheath",
    title: "Платье-футляр строгое офисное",
    category: "dresses",
    categoryLabel: "Платья и сарафаны",
    badge: "Стиль 2026",
    fabric: "Костюмный креп",
    description:
      "Короткое строгое черное платье прямого лаконичного кроя с длинными рукавами для делового дресс-кода.",
    image: "products/dress-black-sheath.webp",
    alt: "Строгое черное офисное платье-футляр Enmoone",
  },
  {
    id: "jeans-baggy-denim",
    title: "Джинсы багги широкие оверсайз",
    category: "bottoms",
    categoryLabel: "Джинсы и брюки",
    badge: "Оверсайз посадка",
    fabric: "100% Cotton деним",
    description:
      "Широкие свободные джинсы багги с непринужденной посадкой на талии и мягким эффектом варки.",
    image: "products/jeans-baggy-denim.webp",
    alt: "Широкие джинсы багги Enmoone из синего денима",
  },
  {
    id: "sundress-linen-choco",
    title: "Платье-сарафан льняной миди",
    category: "dresses",
    categoryLabel: "Платья и сарафаны",
    badge: "100% Натуральный лён",
    fabric: "Шоколадный лён",
    description:
      "Длинный струящийся сарафан в глубоком шоколадном оттенке с открытой спиной и мягким А-силуэтом.",
    image: "products/sundress-linen-choco.webp",
    alt: "Шоколадный льняной сарафан Enmoone с открытой спиной",
  },
  {
    id: "trousers-alladin-black",
    title: "Брюки алладины классические",
    category: "bottoms",
    categoryLabel: "Джинсы и брюки",
    badge: "Свободный силуэт",
    fabric: "Струящаяся ткань",
    description:
      "Объемные классические брюки со складками на поясе для легкого струящегося силуэта.",
    image: "products/trousers-alladin-black.webp",
    alt: "Черные струящиеся классические брюки Enmoone",
  },
  {
    id: "polo-olive-cropped",
    title: "Футболка топ-поло укороченная",
    category: "polo",
    categoryLabel: "Поло и топы",
    badge: "Кроп-силуэт",
    fabric: "Оливковый хлопок",
    description:
      "Укороченное поло с аккуратным отложным воротником в благородном природном оттенке хаки.",
    image: "products/polo-olive-cropped.webp",
    alt: "Оливковый укороченный топ-поло Enmoone",
  },
  {
    id: "set-linen-summer",
    title: "Комплект летний с блузой и шортами",
    category: "sets",
    categoryLabel: "Комплекты",
    badge: "Натуральный лён",
    fabric: "Дышащий белый лён",
    description:
      "Свободная льняная блуза с длинным рукавом и шорты на мягком поясе — комфортный курортный дуэт.",
    image: "products/set-linen-summer.webp",
    alt: "Белый льняной комплект Enmoone из блузы и шорт",
  },
  {
    id: "jeans-flare-blue",
    title: "Джинсы клёш от колена стретч",
    category: "bottoms",
    categoryLabel: "Джинсы и брюки",
    badge: "Идеальная посадка",
    fabric: "Стретч-деним",
    description:
      "Классический деним средней плотности с комфортной растяжимостью и выразительным клёшем от колена.",
    image: "products/jeans-flare-blue.webp",
    alt: "Синие джинсы клёш Enmoone",
  },
];
