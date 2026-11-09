// Company-wide statistics and archival observations live in company-metrics.ts.
export const company = {
  name: "Young Unicorn",
  since: "2020",
  partnerUrl: "https://t.me/kiyamova_alina_yuc",
  source: "По данным welcome-презентации Young Unicorn",
  directions: [
    {
      id: "fashion",
      title: "Fashion",
      status: "Развиваем",
      description:
        "Развиваем собственный бренд одежды на маркетплейсах\nРаботаем с продуктом, его подачей и продажами — от первой коллекции до повторной покупки",
      focus: "Собственный бренд · Маркетплейсы · Контент",
      image: "fashion-editorial.webp",
      alt: "Визуал направления одежды: модели в повседневной коллекции нейтральных оттенков",
    },
    {
      id: "selfcare",
      title: "Self-care",
      status: "В разработке",
      description:
        "Разрабатываем продукты для ежедневного ухода за собой, включая уход за полостью рта.",
      focus: "Ежедневный уход · Уход за полостью рта · Развитие продукта",
      image: "selfcare-editorial.webp",
      alt: "Визуал направления self-care: флакон и баночка для ухода на светлом камне",
    },
  ],
  departments: [
    {
      id: "product",
      title: "Продукт",
      group: "front",
      description: "Разработка и развитие продуктов",
    },
    {
      id: "sales",
      title: "Продажи",
      group: "front",
      description: "Работа с продажами на маркетплейсах",
    },
    {
      id: "marketing",
      title: "Маркетинг",
      group: "front",
      description: "Продвижение брендов и работа со спросом",
    },
    {
      id: "content",
      title: "Контент",
      group: "front",
      description: "Визуальная подача и контент для продуктов",
    },
    {
      id: "finance",
      title: "Финансы",
      group: "back",
      description: "Финансовое планирование и аналитика",
    },
    {
      id: "it",
      title: "IT",
      group: "back",
      description: "Развитие внутренних цифровых инструментов",
    },
    {
      id: "hr",
      title: "HR",
      group: "back",
      description: "Подбор, адаптация и развитие команды",
    },
  ],
} as const;
