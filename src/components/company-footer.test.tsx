import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CompanyFooter } from "./company-footer";
import { company } from "../data/company";

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
    expect(html).toContain('href="/erp/employees"');
    expect(html).not.toContain("company-footer-utility");
    expect(html).not.toContain('id="hero-motion-settings"');
  });
  it("keeps one safe Telegram link without personal details or extra footer copy", () => {
    const html = footer();
    expect(
      html.match(new RegExp(`href="${company.partnerUrl}"`, "g")),
    ).toHaveLength(1);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(1);
    expect(html).toContain("Telegram");
    expect(html).not.toContain("Связаться с HR");
    expect(html).not.toContain("Алина");
    expect(html).not.toContain("Группа компаний");
  });
});
