// Figures supplied in the company's welcome presentation.
// Keep historical portfolio size distinct from the number of active brands.
export const company = {
  name: "Young Unicorn",
  since: "2020",
  partnerUrl: "https://t.me/kiyamova_alina_yuc",
  source: "По данным welcome-презентации Young Unicorn",
  highlights: [
    {
      value: "2",
      unit: "млн+",
      label: "покупателей",
      detail: "выбрали наши продукты",
    },
    { value: "2,7", unit: "млн+", label: "заказов", detail: "на маркетплейсе" },
    {
      value: "3",
      unit: "",
      label: "бренда в портфеле",
      detail: "за весь период работы",
    },
    {
      value: "50–100",
      unit: "%",
      label: "рост оборота",
      detail: "год к году",
      compact: true,
    },
  ],
  marketplace: {
    value: "5",
    unit: "%",
    label: "поставщиков Wildberries",
    prefix: "топ",
  },
  directions: [
    {
      id: "fashion",
      title: "Одежда",
      english: "Fashion",
      status: "Развиваем",
      description:
        "Развиваем собственный бренд одежды на маркетплейсах\nРаботаем с продуктом, его подачей и продажами — от первой коллекции до повторной покупки",
      focus: "Собственный бренд · Маркетплейсы · Контент",
      image: "fashion-editorial.webp",
      alt: "Визуал направления одежды: модели в повседневной коллекции нейтральных оттенков",
    },
    {
      id: "selfcare",
      title: "Уход за собой",
      english: "Self-care",
      status: "Запускаем",
      description:
        "Запускаем направление self-care: понятные продукты для ежедневного ухода\nПереносим опыт e-commerce в новую категорию и проверяем идеи на реальном спросе",
      focus: "Новая категория · Ежедневный уход · Развитие продукта",
      image: "selfcare-editorial.webp",
      alt: "Визуал направления self-care: флакон и баночка для ухода на светлом камне",
    },
    {
      id: "oralcare",
      title: "Уход за полостью рта",
      english: "Oral care",
      status: "Новое направление",
      description:
        "Oral care — отдельное направление ежедневного ухода за полостью рта\nОткрыты к обсуждению продуктов и сотрудничества с производителями",
      focus: "Уход за полостью рта · Продукты · Сотрудничество",
      image: "oralcare-editorial.png",
      alt: "Визуальная концепция Oral care: зубная щётка, тюбик и флакон на светлом камне",
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
