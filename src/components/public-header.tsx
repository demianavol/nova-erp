import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { CompanyBrand } from "./company-brand";
import { SiteThemeToggle } from "./site-theme";
import "../public-header.css";

const anchors = [
  ["about", "Компания"],
  ["directions", "Продукты"],
  ["advantages", "Преимущества"],
  ["partners", "Сотрудничество"],
] as const;
export function PublicHeader({
  employee = false,
  erpRoute = "/login",
  onGuideNavigate,
}: {
  employee?: boolean;
  erpRoute?: string;
  onGuideNavigate?: () => void;
}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
    setAudienceOpen(false);
  }, [location.pathname, location.hash]);
  const jump = (id: string) => {
    setMobileOpen(false);
    if (location.hash === `#${id}`)
      document.getElementById(id)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <header className="lp-header yu-public-header">
      <div className="yu-public-header-inner">
        <Link to="/" className="lp-home" aria-label="Young Unicorn — главная">
          <CompanyBrand />
        </Link>
        {!employee ? (
          <nav
            className={`yu-section-nav${mobileOpen ? " is-open" : ""}`}
            aria-label="О компании"
            id="public-section-nav"
          >
            {anchors.map(([id, title]) => (
              <Link key={id} to={`/#${id}`} onClick={() => jump(id)}>
                {title}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="yu-header-space" />
        )}
        <div className="yu-header-actions">
          <Dropdown.Root open={audienceOpen} onOpenChange={setAudienceOpen}>
            <Dropdown.Trigger
              className="yu-audience-trigger"
              aria-label={`Раздел сайта: ${employee ? "Сотрудникам" : "Партнёрам"}`}
            >
              {employee ? "Сотрудникам" : "Партнёрам"}
              <ChevronDown size={14} aria-hidden="true" />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                className="yu-audience-menu"
                sideOffset={12}
                align="end"
                collisionPadding={12}
              >
                <Dropdown.Item asChild>
                  <Link to="/" aria-current={!employee ? "page" : undefined}>
                    <BriefcaseBusiness size={19} />
                    <span>
                      Партнёрам<small>Компания и сотрудничество</small>
                    </span>
                    {!employee && <Check size={16} />}
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item asChild>
                  <Link
                    to="/employees"
                    onClick={onGuideNavigate}
                    aria-current={employee ? "page" : undefined}
                  >
                    <BookOpen size={19} />
                    <span>
                      Сотрудникам<small>Справочник команды</small>
                    </span>
                    {employee && <Check size={16} />}
                  </Link>
                </Dropdown.Item>
                {employee && (
                  <>
                    <Dropdown.Separator className="yu-audience-separator" />
                    <Dropdown.Item asChild>
                      <Link to={erpRoute}>
                        <ArrowUpRight size={19} />
                        <span>
                          Войти в ERP<small>Задачи и проекты</small>
                        </span>
                      </Link>
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
          <SiteThemeToggle />
          {!employee && (
            <Dropdown.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dropdown.Trigger
                className="yu-mobile-sections"
                aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              >
                {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  className="yu-audience-menu yu-mobile-menu"
                  align="end"
                  sideOffset={12}
                  collisionPadding={12}
                >
                  {anchors.map(([id, title]) => (
                    <Dropdown.Item asChild key={id}>
                      <Link to={`/#${id}`} onClick={() => jump(id)}>
                        {title}
                      </Link>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          )}
        </div>
      </div>
    </header>
  );
}
