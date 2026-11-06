export const experienceCountries = [
  {
    id: "cn",
    name: "Китай",
    english: "China",
    aspect: 3 / 2,
    flag: "/media/global-experience/cn.svg",
    status: "Прототип · На подтверждении",
    description:
      "Информация об опыте Young Unicorn в Китае появится после подтверждения командой.",
  },
  {
    id: "kg",
    name: "Кыргызстан",
    english: "Kyrgyzstan",
    aspect: 5 / 3,
    flag: "/media/global-experience/kg.svg",
    status: "Прототип · На подтверждении",
    description:
      "Информация об опыте Young Unicorn в Кыргызстане появится после подтверждения командой.",
  },
  {
    id: "uz",
    name: "Узбекистан",
    english: "Uzbekistan",
    aspect: 2,
    flag: "/media/global-experience/uz.svg",
    status: "Прототип · На подтверждении",
    description:
      "Информация об опыте Young Unicorn в Узбекистане появится после подтверждения командой.",
  },
] as const;

export type ExperienceCountryId = (typeof experienceCountries)[number]["id"];
