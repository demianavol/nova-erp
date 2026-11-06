import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CareerBadge } from "./career-badge";

describe("Career badge first view", () => {
  it("shows the real badge artwork while the physics chunk is loading", () => {
    const markup = renderToStaticMarkup(
      <CareerBadge image="/legacy-badge.png" reduced={false} />,
    );
    expect(markup).not.toContain("/legacy-badge.png");
    expect(markup).not.toContain("career-badge-static");
    expect(markup).toContain("career-badge-poster-strap");
    expect(markup).toContain("media/careers/badge-front.svg");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Бейдж загружается");
  });
  it("keeps the accessible static control for reduced motion", () => {
    const markup = renderToStaticMarkup(
      <CareerBadge image="/legacy-badge.png" reduced renderSpace="local" />,
    );
    expect(markup).toContain("Перевернуть бейдж Young Unicorn");
    expect(markup).toContain("career-badge-static");
    expect(markup).toContain('aria-busy="false"');
  });
});
