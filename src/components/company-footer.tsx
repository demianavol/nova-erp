import { useSiteLanguage } from "../lib/site-language";
import { useId, type Ref } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CompanyBrand } from "./company-brand";
import { ErpEntryLink } from "./erp-entry-link";
import { company } from "../data/company";
import "../company-footer.css";

const sectionGroups = [
  {
    title: "Компания",
    staff: false,
    links: [
      ["about", "О компании"],
      ["results", "В цифрах"],
      ["directions", "Направления"],
      ["global-experience", "Международный опыт"],
    ],
  },
  {
    title: "Наш подход",
    staff: true,
    links: [
      ["principles", "Принципы"],
      ["future", "Будущее"],
      ["careers", "Команда"],
    ],
  },
] as const;

export function CompanyFooter({
  onJump,
  footerRef,
}: {
  onJump: (id: string) => void;
  footerRef?: Ref<HTMLElement>;
}) {
  const { t } = useSiteLanguage();
  const glow = useId().replace(/:/g, "");
  return (
    <footer
      ref={footerRef}
      id="company-footer"
      className="lp-footer lp-partner-footer company-footer"
    >
      <div className="lp-container company-footer-shell">
        <svg
          className="company-footer-horizon"
          viewBox="0 0 1280 64"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={glow} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="currentColor" stopOpacity="0" />
              <stop offset=".3" stopColor="currentColor" stopOpacity=".16" />
              <stop offset=".57" stopColor="currentColor" stopOpacity=".8" />
              <stop offset=".83" stopColor="currentColor" stopOpacity=".14" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 43C230 43 345 52 505 28S810 2 1010 24s190 19 270 19"
            fill="none"
            stroke={`url(#${glow})`}
            strokeWidth="7"
            opacity=".09"
          />
          <path
            d="M0 43C230 43 345 52 505 28S810 2 1010 24s190 19 270 19"
            fill="none"
            stroke={`url(#${glow})`}
            strokeWidth="1"
          />
        </svg>
        <div className="company-footer-grid">
          <div className="company-footer-brand">
            <Link
              to="/"
              className="company-footer-signature"
              aria-label={t("Young Unicorn — главная")}
            >
              <CompanyBrand compact />
              <span>Young Unicorn</span>
            </Link>
          </div>
          <nav className="company-footer-nav" aria-label={t("Навигация в подвале")}>
            {sectionGroups.map((group) => (
              <div className="company-footer-group" key={group.title}>
                <h2 className="company-footer-heading">{t(group.title)}</h2>
                <div className="company-footer-links">
                  {group.links.map(([id, title]) => (
                    <Link key={id} to={`/#${id}`} onClick={() => onJump(id)}>
                      {t(title)}
                    </Link>
                  ))}
                  {group.staff && (
                    <ErpEntryLink className="company-footer-staff">
                      {t("Сотрудникам")}<ArrowUpRight size={12} aria-hidden="true" />
                    </ErpEntryLink>
                  )}
                </div>
              </div>
            ))}
          </nav>
          <div
            className="company-footer-contact"
            aria-labelledby="contacts-title"
          >
            <h2 id="contacts-title" className="company-footer-heading">
              {t("Контакты")}</h2>
            <a
              className="company-footer-telegram"
              href={company.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
              <span className="company-footer-contact-arrow">
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
