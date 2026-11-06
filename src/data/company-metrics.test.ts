import { describe, expect, it } from "vitest";
import {
  companyMetrics,
  companyMetricDefinitions,
  demoYearlyActivity,
  historicalMetricSources,
  metricDisplayUnit,
  metricDisplayValue,
} from "./company-metrics";

describe("company statistics publication and provenance", () => {
  it("shows all-time totals and exposes the complete annual structure separately", () => {
    for (const [id, key, scale] of [
      ["customers", "newCustomers", 1000],
      ["orders", "orders", 1000],
      ["reviews", "ratings", 1],
    ] as const) {
      const metric = companyMetrics.find((metric) => metric.id === id)!;
      const expected = demoYearlyActivity.reduce(
        (total, row) => total + row[key],
        0,
      );
      expect(Number(metric.value!.replace(/\s/g, "")) * scale).toBe(expected);
      expect(metric.periodKind).toBe("all-time");
      expect(metric.period).toBe("2020–02.11.2026");
      expect(metric.yearlyBreakdown?.map((row) => row.year)).toEqual([
        2020, 2021, 2022, 2023, 2024, 2025, 2026,
      ]);
      expect(metric.detail).not.toContain("за 2025");
    }
  });

  it("weights the lifetime company rating by all annual rating counts", () => {
    const ratings = demoYearlyActivity.reduce(
      (total, row) => total + row.ratings,
      0,
    );
    const weighted =
      demoYearlyActivity.reduce(
        (total, row) => total + row.ratings * row.rating,
        0,
      ) / ratings;
    const unweighted =
      demoYearlyActivity.reduce((total, row) => total + row.rating, 0) /
      demoYearlyActivity.length;
    const metric = companyMetrics.find((metric) => metric.id === "rating")!;
    expect(Number(metric.value!.replace(",", "."))).toBe(
      Number(weighted.toFixed(1)),
    );
    expect(metric.value).not.toBe(unweighted.toFixed(1).replace(".", ","));
    expect(metric.aggregation).toBe("weighted");
    expect(
      metric.yearlyBreakdown?.every((row) => row.detail?.includes("оценок")),
    ).toBe(true);
  });

  it("publishes historical brand count as a single value and keeps active brands separate", () => {
    const brands = companyMetrics.find((metric) => metric.id === "brands")!;
    expect(brands.value).toBe("4");
    expect(brands.label).toBe("бренда в истории");
    expect(brands.detail).toBe("2 активных сейчас");
    expect(brands.value).not.toContain("/");
    expect(brands.brandCounts).toEqual({ historical: 4, active: 2 });
  });

  it("compares growth across completed historical years and excludes the incomplete year", () => {
    const completed = demoYearlyActivity.filter((row) => row.revenue !== null);
    const growth = companyMetrics.find((metric) => metric.id === "growth")!;
    const expected = Math.round(
      (completed.at(-1)!.revenue! / completed[0].revenue! - 1) * 100,
    );
    expect(growth.value).toBe(`+${expected}`);
    expect(growth.periodKind).toBe("comparison");
    expect(growth.period).toContain("2025 к 2020");
    expect(growth.yearlyBreakdown?.at(-1)?.value).toBe("Год не завершён");
  });

  it("leaves all seven company aggregates pending instead of reusing partial observations", () => {
    expect(companyMetricDefinitions).toHaveLength(7);
    expect(new Set(companyMetricDefinitions.map(({ id }) => id)).size).toBe(7);
    for (const metric of companyMetricDefinitions) {
      expect(metric.scope.kind).toBe("company");
      expect(metric.verification).toBe("pending");
      expect(metric.value).toBeNull();
      expect(metricDisplayValue(metric)).toBe("—");
      expect(metricDisplayUnit(metric)).toBe("");
    }
  });

  it("labels every requested test figure as demo without promoting it to verified data", () => {
    expect(companyMetrics).toHaveLength(7);
    for (const metric of companyMetrics) {
      expect(metric.verification).toBe("demo");
      expect(metricDisplayValue(metric)).not.toBe("—");
      expect(metric.source?.label).toContain("Тестовый набор");
      expect(metric.period).toBeTruthy();
    }
    const achievements = companyMetrics.find(
      ({ id }) => id === "achievements",
    )!;
    expect(achievements.marketplaceAchievements).toHaveLength(3);
    expect(
      achievements.marketplaceAchievements?.every(
        (record) =>
          record.scope.kind === "brand" &&
          record.verification === "demo" &&
          record.category &&
          record.period &&
          record.source,
      ),
    ).toBe(true);
  });

  it("never publishes an archival or unverified numeric claim", () => {
    for (const record of historicalMetricSources) {
      expect(record.value).not.toBeNull();
      expect(metricDisplayValue(record)).toBe("—");
      expect(metricDisplayUnit(record)).toBe("");
    }
    const approved = {
      ...companyMetrics[0],
      value: "12",
      unit: "тыс.",
      verification: "verified" as const,
      period: "2025",
      source: { label: "Согласованный отчёт" },
    };
    expect(metricDisplayValue(approved)).toBe("12");
    expect(metricDisplayUnit(approved)).toBe("тыс.");
  });

  it("retains original product and brand figures with their exact scope and snapshot date", () => {
    const rating = historicalMetricSources.find(
      ({ id }) => id === "enmoone-shirt-rating",
    )!;
    const counts = historicalMetricSources.find(
      ({ id }) => id === "enmoone-shirt-ratings",
    )!;
    const likes = historicalMetricSources.find(
      ({ id }) => id === "enmoone-brand-likes",
    )!;
    expect(rating.value).toBe("4,9");
    expect(rating.scope.kind).toBe("product");
    expect(counts.value?.replace(/\s/g, "")).toBe("25943");
    expect(counts.scope).toEqual(rating.scope);
    expect(likes.value?.replace(/\s/g, "")).toBe("3418");
    expect(likes.scope.kind).toBe("brand");
    for (const record of [rating, counts, likes]) {
      expect(record.period).toBe("29.10.2026");
      expect(record.verification).toBe("source-observed");
    }
  });

  it("keeps historical portfolio size distinct from active brands and turnover distinct from revenue", () => {
    expect(
      companyMetricDefinitions.find(({ id }) => id === "brands")?.brandCounts,
    ).toEqual({
      historical: null,
      active: null,
    });
    const growth = historicalMetricSources.find(
      ({ id }) => id === "presentation-turnover-growth",
    )!;
    expect(growth.value).toBe("50–100");
    expect(growth.label).toContain("оборота");
    expect(growth.period).toBeNull();
    expect(
      companyMetricDefinitions.find(({ id }) => id === "growth")?.value,
    ).toBeNull();
  });

  it("preserves marketplace ranking provenance without inventing its brand, category or period", () => {
    const ranking = historicalMetricSources.find(
      ({ id }) => id === "presentation-marketplace",
    )!;
    expect(ranking.value).toBe("Топ-5");
    expect(ranking.unit).toBe("%");
    expect(ranking.achievement).toEqual({
      marketplace: "Wildberries",
      brand: null,
      category: null,
    });
    expect(ranking.period).toBeNull();
    expect(ranking.verification).toBe("unverified");
    expect(
      companyMetricDefinitions.find(({ id }) => id === "achievements")
        ?.marketplaceAchievements,
    ).toEqual([]);
  });
});
