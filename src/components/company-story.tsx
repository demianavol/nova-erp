import { ArrowUpRight } from "lucide-react";
import { AnimatedCompanyMark } from "./company-scene";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;

export function CompanyStory({
  onOpenShowcase,
}: {
  onOpenShowcase: () => void;
}) {
  return (
    <figure
      className="company-showcase"
      aria-label="Портфель Young Unicorn: Enmoone, self-care и oral care"
    >
      <button
        className="showcase-brand"
        type="button"
        onClick={onOpenShowcase}
        aria-label="Открыть каталог бренда Enmoone"
      >
        <span className="showcase-brand-heading">
          <strong>Enmoone</strong>
          <span>Женская одежда / Wildberries</span>
          <ArrowUpRight size={22} aria-hidden="true" />
        </span>
        <span className="showcase-photos">
          <span>
            <img
              src={asset("products/shirt-burgundy-stripe.webp")}
              alt="Рубашка в полоску из каталога Enmoone"
              width="300"
              height="390"
              fetchPriority="high"
            />
          </span>
          <span className="showcase-detail">
            <img
              src={asset("products/blouse-slim-sand.webp")}
              alt="Деталь блузки Enmoone"
              width="300"
              height="390"
            />
          </span>
        </span>
      </button>
      <div className="showcase-next">
        <AnimatedCompanyMark replayable />
        <div className="showcase-roadmap">
          <span>Следующие направления</span>
          <dl>
            <div>
              <dt>Self-care</dt>
              <dd>В разработке</dd>
            </div>
            <div>
              <dt>Oral care</dt>
              <dd>В разработке</dd>
            </div>
          </dl>
        </div>
      </div>
    </figure>
  );
}
