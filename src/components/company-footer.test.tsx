import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CompanyFooter } from "./company-footer";
import { publicContactUrl } from "../data/company";

function footer() {
  return renderToStaticMarkup(
    <MemoryRouter>
      <CompanyFooter onJump={() => {}} />
    </MemoryRouter>,
  );
}
describe("Company footer", () => {
  it("preserves the seven existing section destinations and employee entry", () => {
    const html = footer();
    for (const id of [
      "results",
      "about",
      "directions",
      "global-experience",
      "principles",
      "future",
      "careers",
    ]) {
      expect(html).toContain(`href="/#${id}"`);
    }
    expect(html).toContain('href="/erp"');
    expect(html).not.toContain("company-footer-utility");
    expect(html).not.toContain('id="hero-motion-settings"');
  });
  it("keeps one safe Telegram link without personal details or extra footer copy", () => {
    const html = footer();
    expect(html.split(`href="${publicContactUrl()}"`)).toHaveLength(2);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(1);
    expect(html).toContain("Telegram");
    expect(html).not.toContain("Связаться с HR");
    expect(html).not.toContain("Алина");
    expect(html).not.toContain("Группа компаний");
  });
  it("opens the configured application bot from the footer", () => {
    vi.stubEnv("VITE_TELEGRAM_APPLICATION_BOT", "@example_yuc_bot");
    try {
      expect(footer()).toContain("https://t.me/example_yuc_bot?start=general");
      expect(publicContactUrl("partnership")).toBe(
        "https://t.me/example_yuc_bot?start=partnership",
      );
      expect(publicContactUrl("careers")).toBe(
        "https://t.me/example_yuc_bot?start=careers",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
