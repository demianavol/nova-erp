import { describe, expect, it } from "vitest";
import { companyJourney } from "./company-journey";

describe("company journey editorial content", () => {
  it("provides seven ordered scenes with reserved image geometry and concise copy", () => {
    expect(companyJourney.map((step) => step.year)).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
    for (const step of companyJourney) {
      expect(step.visual.asset).toBeTruthy();
      expect(step.visual.alt).toBeTruthy();
      expect(step.visual.width).toBeGreaterThan(0);
      expect(step.visual.height).toBeGreaterThan(0);
      expect(step.description.length).toBeLessThan(180);
    }
  });

  it("keeps draft milestones and product-specific proof distinct from company statistics", () => {
    expect(
      companyJourney
        .filter((step) => step.status === "draft")
        .map((step) => step.year),
    ).toEqual(["2021", "2022", "2023", "2024", "2025"]);
    expect(companyJourney.filter((step) => step.proof)).toHaveLength(1);
    const proof = companyJourney.at(-1)!.proof!;
    expect(proof.scope).toBe("product");
    expect(proof.label).toContain("Рубашка Enmoone");
    expect(proof.source).toContain("29.10.2026");
  });
});
