import { describe, it, expect } from "vitest";
import { companyCareers } from "./company-careers";

describe("companyCareers data", () => {
  it("has the approved headlines and subtitle", () => {
    expect(companyCareers.title).toBe("Стань частью");
    expect(companyCareers.accent).toBe("Young Unicorn");
    expect(companyCareers.subtitle).toBe(
      "Создавай сильные бренды. Расти вместе с нами",
    );
    expect(companyCareers.eyebrow).toBe("Команда");
  });

  it("contains the five benefits and the new sixth learning stop", () => {
    expect(companyCareers.benefits).toHaveLength(6);
    const ids = companyCareers.benefits.map((b) => b.id);
    expect(ids).toEqual([
      "growth",
      "impact",
      "team",
      "projects",
      "freedom",
      "learning",
    ]);

    const titles = companyCareers.benefits.map((b) => b.title);
    expect(titles).toEqual([
      "Быстрый рост",
      "Влияние на продукт",
      "Сильная команда",
      "Реальные проекты",
      "Свобода решений",
      "Новые знания",
    ]);

    for (const benefit of companyCareers.benefits) {
      expect(benefit.description.length).toBeGreaterThan(10);
      expect(benefit.icon).toMatch(/^media\/careers\/.+-refined\.webp$/);
    }
  });

  it("points to approved assets and legitimate hr contact", () => {
    expect(companyCareers.badge).toBe(
      "media/careers/employee-badge-blank-v2-refined.webp",
    );
    expect(companyCareers.employerValueStatus).toContain(
      "pending employer approval",
    );
    expect(companyCareers.hrUrl).toBe("https://t.me/kiyamova_alina_yuc");
  });
});
