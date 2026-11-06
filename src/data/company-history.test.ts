import { describe, expect, it } from "vitest";
import { milestones } from "./company-history";
import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
} from "./product-evidence";

describe("company history provenance", () => {
  it("keeps synthetic annual results separate from company source material", () => {
    expect(milestones.map(({ year }) => year)).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
    const demos = milestones.filter(({ synthetic }) => synthetic);
    expect(demos.map(({ year }) => year)).toEqual([
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
    ]);
    expect(demos.map(({ achievement }) => achievement.value)).toEqual([
      "15",
      "60",
      "180",
      "450",
      "900",
    ]);
    expect(
      demos.every(({ achievement }) => achievement.label === "заказов за год"),
    ).toBe(true);
  });

  it("uses founding without invented metrics and the specific product snapshot for 2026", () => {
    const founding = milestones[0];
    expect(founding.synthetic).toBeUndefined();
    expect(founding.achievement.text).toBe(true);
    expect(founding.achievement.value).not.toMatch(/\d/);
    const current = milestones.at(-1)!;
    const proof = getProductEvidence("shirt-burgundy-stripe");
    expect(current.synthetic).toBeUndefined();
    expect(current.achievement.value).toBe(ratingLabel(proof.rating));
    expect(proof.ratings).toBe(25943);
    expect(current.source).toContain(marketplaceSnapshot.dateLabel);
    expect(marketplaceSnapshot.dateLabel).toBe("29.10.2026");
  });

  it("preserves punctuation-free short public copy", () => {
    for (const item of milestones) {
      for (const text of [
        item.label,
        item.title,
        item.text,
        item.achievement.label,
        ...item.facts,
      ]) {
        expect(text).not.toMatch(/\.\s*$/);
      }
    }
  });
});
