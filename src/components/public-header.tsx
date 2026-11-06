import { useEffect, useId, useState } from "react";
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
import { SiteThemeToggle } from "./site-theme";
import "../public-header.css";

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
        {group.title}
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
                "aria-label": `Разделы: ${group.title}`,
              })}
            >
              <div className="yu-category-panel" style={styles}>
                <div className="yu-category-heading">
                  <span>{group.title}</span>
                  <p>{group.summary}</p>
                </div>
                <nav aria-label={`Разделы: ${group.title}`}>
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
                        <strong>{title}</strong>
                        <small>{description}</small>
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

export function PublicHeader() {
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
        <Link to="/" className="lp-home" aria-label="Young Unicorn — главная">
          <span className="yu-company-chip">
            <CompanyBrand compact />
            <span className="yu-brand-name">
              Young Unicorn<small>Company</small>
            </span>
          </span>
        </Link>

        <nav
          className={`yu-section-nav${mobileOpen ? " is-open" : ""}`}
          aria-label="О компании"
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
          <Link to="/erp/employees" className="yu-erp-entry">
            Войти в ERP <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <SiteThemeToggle />

          <Dropdown.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dropdown.Trigger
              className="yu-mobile-sections"
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              <span>Разделы</span>
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
                      {group.title}
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
                          <span>{title}</span>
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </Link>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Group>
                ))}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
      </div>
    </header>
  );
}
