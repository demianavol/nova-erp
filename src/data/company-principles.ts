export interface CompanyPrinciple {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  icon600: string;
  iconWebp: string;
  iconAlt: string;
  welcomeSlide: string;
}

export interface PrinciplesSectionData {
  eyebrow: string;
  headline: string;
  description: string;
  principles: CompanyPrinciple[];
}

export const companyPrinciplesData: PrinciplesSectionData = {
  eyebrow: "Наш подход",
  headline: "Наши принципы и ценности",
  description: "На чём мы строим продукты, команду и отношения с покупателями",
  principles: [
    {
      id: "experiment",
      number: "01",
      title: "Экспериментируем",
      description:
        "Быстро проверяем гипотезы и развиваем идеи, которые находят отклик у аудитории.",
      icon: "lavender_glass_light_bulb_icon.png",
      icon600: "lavender_glass_light_bulb_icon-600.png",
      iconWebp: "lavender_glass_light_bulb_icon.webp",
      iconAlt:
        "3D лавандовая стеклянная лампочка — символ экспериментов и гипотез",
      welcomeSlide: "Слайд 15 · HADI-циклы и гипотезы",
    },
    {
      id: "data-driven",
      number: "02",
      title: "Опираемся на данные",
      description:
        "Принимаем решения на основе спроса, обратной связи и реальных результатов.",
      icon: "lavender_glass_bullseye_with_dart.png",
      icon600: "lavender_glass_bullseye_with_dart-600.png",
      iconWebp: "lavender_glass_bullseye_with_dart.webp",
      iconAlt:
        "3D лавандовая стеклянная мишень со стрелой — символ решений на основе данных",
      welcomeSlide: "Слайд 6 · Модель тестирования продукта",
    },
    {
      id: "growth",
      number: "03",
      title: "Постоянно развиваемся",
      description:
        "Работаем короткими циклами, улучшаем продукты и адаптируемся к изменениям.",
      icon: "glossy_lavender_glass_rocket.png",
      icon600: "glossy_lavender_glass_rocket-600.png",
      iconWebp: "glossy_lavender_glass_rocket.webp",
      iconAlt:
        "3D лавандовая стеклянная ракета — символ непрерывного развития и спринтов",
      welcomeSlide: "Слайды 10–12 · Agile-принципы и короткие спринты",
    },
    {
      id: "teamwork",
      number: "04",
      title: "Работаем вместе",
      description:
        "Ценим открытость, уважение, самостоятельность и общую ответственность.",
      icon: "glossy_lavender_glass_handshake.png",
      icon600: "glossy_lavender_glass_handshake-600.png",
      iconWebp: "glossy_lavender_glass_handshake.webp",
      iconAlt:
        "3D лавандовое стеклянное рукопожатие — символ командной работы и уважения",
      welcomeSlide: "Слайд 19 · Коммуникация и взаимное уважение",
    },
    {
      id: "value",
      number: "05",
      title: "Создаём ценность",
      description:
        "Разрабатываем качественные продукты, отвечающие реальным потребностям покупателей.",
      icon: "lavender_glass_heart_icon.png",
      icon600: "lavender_glass_heart_icon-600.png",
      iconWebp: "lavender_glass_heart_icon.webp",
      iconAlt:
        "3D лавандовое стеклянное сердце — символ создания ценности для покупателей",
      welcomeSlide: "Слайд 4 · Философия продукта и бренда",
    },
    {
      id: "responsibility",
      number: "06",
      title: "Отвечаем за результат",
      description:
        "Проявляем инициативу и доводим идеи до конкретного результата.",
      icon: "glossy_purple_glass_shield_checkmark.png",
      icon600: "glossy_purple_glass_shield_checkmark-600.png",
      iconWebp: "glossy_purple_glass_shield_checkmark.webp",
      iconAlt:
        "3D фиолетовый стеклянный щит с галочкой — символ ответственности за результат",
      welcomeSlide: "Слайд 23 · Инициатива и ответственность",
    },
  ],
};
