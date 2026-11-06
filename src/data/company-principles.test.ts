import { describe, expect, it } from "vitest";
import { companyPrinciplesData } from "./company-principles";

describe("company principles data", () => {
  it("provides six numbered principles with exact formulations and visual metadata", () => {
    const { principles } = companyPrinciplesData;
    expect(principles).toHaveLength(6);
    expect(principles.map((p) => p.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);

    expect(principles[0].title).toBe("Экспериментируем");
    expect(principles[0].icon).toBe("lavender_glass_light_bulb_icon.png");

    expect(principles[1].title).toBe("Опираемся на данные");
    expect(principles[1].icon).toBe("lavender_glass_bullseye_with_dart.png");

    expect(principles[2].title).toBe("Постоянно развиваемся");
    expect(principles[2].icon).toBe("glossy_lavender_glass_rocket.png");

    expect(principles[3].title).toBe("Работаем вместе");
    expect(principles[3].icon).toBe("glossy_lavender_glass_handshake.png");

    expect(principles[4].title).toBe("Создаём ценность");
    expect(principles[4].icon).toBe("lavender_glass_heart_icon.png");

    expect(principles[5].title).toBe("Отвечаем за результат");
    expect(principles[5].icon).toBe("glossy_purple_glass_shield_checkmark.png");

    for (const p of principles) {
      expect(p.description.trim().length).toBeGreaterThan(20);
      expect(p.iconAlt.trim().length).toBeGreaterThan(10);
      expect(p.welcomeSlide).toContain("Слайд");
    }
  });

  it("contains complete editorial section header copy", () => {
    expect(companyPrinciplesData.eyebrow).toBe("Наш подход");
    expect(companyPrinciplesData.headline).toBe("Наши принципы и ценности");
    expect(companyPrinciplesData.description).toContain(
      "На чём мы строим продукты",
    );
  });
});
