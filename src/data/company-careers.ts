import { company } from "./company";

export interface CareerBenefit {
  id: "growth" | "impact" | "team" | "projects" | "freedom" | "learning";
  title: string;
  description: string;
}

export const companyCareers = {
  eyebrow: "Команда",
  title: "Стань частью",
  accent: "Young Unicorn",
  subtitle: "Создавай сильные бренды. Расти вместе с нами",
  benefits: [
    {
      id: "growth",
      title: "Быстрый рост",
      description: "Рост в ответственности, масштабе задач и экспертизе",
    },
    {
      id: "impact",
      title: "Влияние на продукт",
      description: "Прямое участие в развитии продуктов и ключевых решений",
    },
    {
      id: "team",
      title: "Сильная команда",
      description: "Обмен опытом и поддержка коллег в общих задачах",
    },
    {
      id: "projects",
      title: "Реальные проекты",
      description: "От идеи до запуска продукта в e-commerce",
    },
    {
      id: "freedom",
      title: "Свобода решений",
      description: "Предлагай идеи и выбирай подход к решению задач",
    },
    {
      id: "learning",
      title: "Новые знания",
      description: "Учись новому и применяй знания в работе",
    },
  ] as const satisfies readonly CareerBenefit[],
  employerValueStatus: "Provisional wording; pending employer approval",
  badge: "media/careers/employee-badge-blank-v2-refined.webp",
  hrUrl: company.partnerUrl,
  vacanciesDestinationStatus:
    "HR contact fallback; dedicated vacancies URL pending approval",
} as const;
