import { siteLanguages, useSiteLanguage } from "../lib/site-language";
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  safePolygon,
  useFloating,
  useHover,
  useFocus,
  useClick,
  useDismiss,
  useInteractions,
  useTransitionStyles,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import {
  ArrowUpRight,
  Check,
  Menu,
  X,
  ChevronDown,
  History,
  ChartNoAxesCombined,
  Layers3,
  Boxes,
  Globe2,
  Mountain,
  Users,
  Handshake,
} from "lucide-react";
import { CompanyBrand } from "./company-brand";
import { ErpEntryLink } from "./erp-entry-link";
import { SiteThemeToggle } from "./site-theme";
import "../public-header.css";
import "../site-language-transition.css";

const navigationGroups = [
  {
    id: "company",
    title: "Компания",
    summary: "Знакомство с Young Unicorn",
    links: [
      {
        id: "about",
        title: "Наш путь",
        description: "От основания до сегодняшнего дня",
        Icon: History,
      },
      {
        id: "results",
        title: "Компания в цифрах",
        description: "Покупатели, заказы и рост",
        Icon: ChartNoAxesCombined,
      },
      {
        id: "principles",
        title: "Принципы",
        description: "На чём строится наша работа",
        Icon: Layers3,
      },
    ],
  },
  {
    id: "growth",
    title: "Бренды и развитие",
    summary: "Что создаём и куда движемся",
    links: [
      {
        id: "directions",
        title: "Продукты",
        description: "Направления и портфель брендов",
        Icon: Boxes,
      },
      {
        id: "global-experience",
        title: "Международный опыт",
        description: "Сотрудничество без границ",
        Icon: Globe2,
      },
      {
        id: "future",
        title: "Будущее",
        description: "Цели и новые горизонты",
        Icon: Mountain,
      },
    ],
  },
  {
    id: "people",
    title: "Команда и партнёры",
    summary: "Люди, с которыми мы растём",
    links: [
      {
        id: "careers",
        title: "Команда",
        description: "Возможности и карьера",
        Icon: Users,
      },
      {
        id: "contacts",
        title: "Партнёрство",
        description: "Создавать сильные бренды вместе",
        Icon: Handshake,
      },
    ],
  },
] as const;
const anchors = navigationGroups.flatMap((group) =>
  group.links.map((item) => [item.id, item.title] as const),
);
type NavigationGroup = (typeof navigationGroups)[number];

function HeaderCategory({
  group,
  activeId,
  onJump,
}: {
  group: NavigationGroup;
  activeId: string;
  onJump: (id: string) => void;
}) {
  const { t } = useSiteLanguage();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const location = useLocation();
  useEffect(() => setOpen(false), [location.hash, location.pathname]);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip({ padding: 14 }), shift({ padding: 14 })],
  });
  const hover = useHover(context, {
    mouseOnly: true,
    delay: { open: 100, close: 140 },
    handleClose: safePolygon({ blockPointerEvents: false }),
  });
  const click = useClick(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    focus,
    dismiss,
  ]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 180,
    initial: { opacity: 0, transform: "translateY(-6px) scale(.985)" },
  });
  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        className="yu-category-trigger"
        data-active={group.links.some((item) => item.id === activeId)}
        aria-expanded={open}
        aria-controls={panelId}
        {...getReferenceProps()}
      >
        <span className="yu-category-label">{t(group.title)}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {isMounted && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              id={panelId}
              className="yu-category-positioner"
              {...getFloatingProps({
                role: "region",
                "aria-label": t("Разделы: {0}", t(group.title)),
              })}
            >
              <div className="yu-category-panel" style={styles}>
                <div className="yu-category-heading">
                  <span>{t(group.title)}</span>
                  <p>{t(group.summary)}</p>
                </div>
                <nav aria-label={t("Разделы: {0}", t(group.title))}>
                  {group.links.map(({ id, title, description, Icon }) => (
                    <Link
                      key={id}
                      to={`/#${id}`}
                      aria-current={activeId === id ? "location" : undefined}
                      onClick={() => {
                        setOpen(false);
                        onJump(id);
                      }}
                    >
                      <span className="yu-category-icon">
                        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="yu-category-copy">
                        <strong>{t(title)}</strong>
                        <small>{t(description)}</small>
                      </span>
                      <ArrowUpRight
                        className="yu-category-arrow"
                        size={13}
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

function LanguageSelector({ inMenu = false }: { inMenu?: boolean }) {
  const { language, changeLanguage, t } = useSiteLanguage();
  const selected = siteLanguages.find(({ id }) => id === language)!;
  const [confirmed, setConfirmed] = useState(false);
  const activeTransition = useRef<ViewTransition | null>(null);

  useEffect(() => {
    if (!confirmed) return;
    const timeout = window.setTimeout(() => setConfirmed(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [confirmed, language]);

  useEffect(
    () => () => {
      const transition = activeTransition.current;
      activeTransition.current = null;
      if (transition) {
        transition.skipTransition();
        delete document.documentElement.dataset.siteLanguageTransition;
      }
    },
    [],
  );

  function selectLanguage(value: string) {
    if (value === language) return;

    const root = document.documentElement;
    const apply = () => {
      changeLanguage(value);
      setConfirmed(true);
    };

    activeTransition.current?.skipTransition();
    activeTransition.current = null;
    if (
      !document.startViewTransition ||
      !CSS.supports("view-transition-name", "match-element") ||
      !matchMedia("(prefers-reduced-motion: no-preference)").matches ||
      root.matches("[data-site-theme-reveal], [data-erp-entry-transition]")
    ) {
      delete root.dataset.siteLanguageTransition;
      apply();
      return;
    }

    root.dataset.siteLanguageTransition = "";
    const transition = document.startViewTransition(() => {
      if (activeTransition.current === transition) flushSync(apply);
    });
    activeTransition.current = transition;
    const finish = () => {
      if (activeTransition.current !== transition) return;
      activeTransition.current = null;
      delete root.dataset.siteLanguageTransition;
    };
    void transition.ready.catch(() => {});
    void transition.finished.then(finish, finish);
  }

  const options = (
    <Dropdown.RadioGroup
      value={language}
      onValueChange={selectLanguage}
      aria-label={t("Язык сайта")}
    >
      {siteLanguages.map(({ id, code, label }) => (
        <Dropdown.RadioItem
          key={id}
          value={id}
          className="yu-language-option"
          textValue={label}
          onSelect={inMenu ? (event) => event.preventDefault() : undefined}
        >
          <span className="yu-language-tile" lang={id} aria-hidden="true">
            {code}
          </span>
          <span lang={id}>{label}</span>
          <Dropdown.ItemIndicator className="yu-language-check">
            <Check size={15} aria-hidden="true" />
          </Dropdown.ItemIndicator>
        </Dropdown.RadioItem>
      ))}
    </Dropdown.RadioGroup>
  );
  if (inMenu) {
    return (
      <>
        <Dropdown.Label className="yu-mobile-category-label">
          {t("Язык сайта")}
        </Dropdown.Label>
        {options}
      </>
    );
  }

  return (
    <div className="yu-language">
      <Dropdown.Root
        modal={false}
        onOpenChange={(open) => {
          if (open) setConfirmed(false);
        }}
      >
        <Dropdown.Trigger
          className="yu-language-trigger"
          aria-label={t("Язык сайта: {0}", selected.label)}
          data-switched={confirmed || undefined}
        >
          <Globe2 size={15} aria-hidden="true" />
          <span className="yu-language-code-window" aria-hidden="true">
            <span key={language} className="yu-language-code" lang={language}>
              {selected.code}
            </span>
          </span>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            className="yu-audience-menu yu-language-menu"
            align="end"
            sideOffset={12}
            collisionPadding={12}
            aria-label={t("Язык сайта")}
          >
            <Dropdown.Label className="yu-language-heading">
              {t("Язык сайта")}
            </Dropdown.Label>
            {options}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <div className="yu-language-status" role="status" lang={language}>
        {confirmed && (
          <span key={language} className="yu-language-notice">
            <Check size={14} aria-hidden="true" />
            {t("Язык изменён · {0}", selected.label)}
          </span>
        )}
      </div>
    </div>
  );
}

export function PublicHeader() {
  const { t } = useSiteLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState(location.hash.slice(1));
  useEffect(() => {
    setMobileOpen(false);
    setActiveId(location.hash.slice(1));
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current) setActiveId(current.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    for (const id of ["hero", ...anchors.map(([id]) => id)]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  const jump = (id: string) => {
    setMobileOpen(false);
    setActiveId(id);
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
        <Link
          to="/"
          className="lp-home"
          aria-label={t("Young Unicorn — главная")}
        >
          <span className="yu-company-chip">
            <CompanyBrand compact />
            <span className="yu-brand-name">
              Young Unicorn<small>Company</small>
            </span>
          </span>
        </Link>

        <nav
          className={`yu-section-nav${mobileOpen ? " is-open" : ""}`}
          aria-label={t("О компании")}
          id="public-section-nav"
        >
          {navigationGroups.map((group) => (
            <HeaderCategory
              key={group.id}
              group={group}
              activeId={activeId}
              onJump={jump}
            />
          ))}
        </nav>

        <div className="yu-header-actions">
          <ErpEntryLink className="yu-erp-entry">
            <span className="yu-erp-label">{t("Войти в ERP")}</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </ErpEntryLink>
          <SiteThemeToggle />
          <LanguageSelector />

          <Dropdown.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dropdown.Trigger
              className="yu-mobile-sections"
              aria-label={mobileOpen ? t("Закрыть меню") : t("Открыть меню")}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              <span>{t("Разделы")}</span>
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                className="yu-audience-menu yu-mobile-menu"
                align="end"
                sideOffset={12}
                collisionPadding={12}
              >
                {navigationGroups.map((group) => (
                  <Dropdown.Group key={group.id}>
                    <Dropdown.Label className="yu-mobile-category-label">
                      {t(group.title)}
                    </Dropdown.Label>
                    {group.links.map(({ id, title, Icon }) => (
                      <Dropdown.Item asChild key={id}>
                        <Link
                          to={`/#${id}`}
                          onClick={() => jump(id)}
                          aria-current={
                            activeId === id ? "location" : undefined
                          }
                        >
                          <Icon
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <span>{t(title)}</span>
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </Link>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Group>
                ))}
                <Dropdown.Group className="yu-mobile-preferences">
                  <SiteThemeToggle inMenu />
                  <LanguageSelector inMenu />
                </Dropdown.Group>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
      </div>
    </header>
  );
}
