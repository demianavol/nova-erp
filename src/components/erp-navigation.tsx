import { useState, type Ref } from "react";
import { Link, NavLink, matchPath, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  GraduationCap,
  House,
  Layers3,
  ListTodo,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Shield,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { erpSections, salesPages, type ErpPage } from "../data/erp-sections";
import { canOpenErpPage } from "../data/erp-preview";
import { cn } from "../lib/utils";
import { Button } from "./ui";

type Entry = { icon: LucideIcon } & (
  | ErpPage
  | {
      id: "learning" | "departments";
      label: string;
      pages: ErpPage[];
    }
);

export const erpNavigation: { title: string; entries: Entry[] }[] = [
  {
    title: "Основное",
    entries: [
      { ...erpSections.home, icon: House },
      {
        id: "learning",
        label: "Обучение",
        icon: GraduationCap,
        pages: [
          erpSections.firstSteps,
          erpSections.learning,
          erpSections.handbook,
        ],
      },
      {
        id: "departments",
        label: "Отделы",
        icon: Layers3,
        pages: [
          erpSections.sales,
          erpSections.marketing,
          erpSections.purchasing,
          erpSections.warehouse,
          erpSections.finance,
        ],
      },
    ],
  },
  {
    title: "Команда",
    entries: [
      { ...erpSections.team, icon: Users },
      { ...erpSections.orgStructure, icon: Network },
      { ...erpSections.profile, icon: UserRound },
    ],
  },
  {
    title: "Работа",
    entries: [
      { ...erpSections.documents, icon: FileText },
      { ...erpSections.tasks, icon: ListTodo },
      { ...erpSections.projects, icon: Layers3 },
    ],
  },
  {
    title: "Система",
    entries: [
      { ...erpSections.settings, icon: Settings2 },
      { ...erpSections.access, icon: Shield },
    ],
  },
];

function pageIsActive(page: ErpPage, pathname: string) {
  if (page.to === erpSections.sales.to)
    return Boolean(matchPath("/erp/sales/*", pathname));
  if (
    page.to === erpSections.learning.to &&
    matchPath("/erp/learning/lesson/:lessonId", pathname)
  )
    return true;
  return Boolean(matchPath(page.to, pathname));
}

function statusLabel(ready: boolean) {
  return ready ? "Готово" : "В разработке";
}

export function ErpSectionStatus({ ready }: { ready: boolean }) {
  return (
    <span className="erp-section-status" data-ready={ready}>
      {statusLabel(ready)}
    </span>
  );
}

export function ErpSectionPlaceholder({ page }: { page: ErpPage }) {
  return (
    <section
      className="card erp-section-placeholder"
      aria-labelledby="erp-section-title"
    >
      <h1 className="erp-page-title" id="erp-section-title">
        {page.label}
      </h1>
      <ErpSectionStatus ready={page.ready} />
      <Link className="btn btn-outline" to={erpSections.home.to}>
        <ArrowLeft size={16} aria-hidden="true" /> На главную
      </Link>
    </section>
  );
}

export function SalesNavigation() {
  return (
    <nav className="erp-sales-tabs" aria-label="Разделы продаж">
      {Object.values(salesPages).map(({ to, label }) => (
        <NavLink to={to} key={to} end>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function ErpNavigation({
  sidebarRef,
  collapsed,
  smallScreen,
  mobile,
  toggle,
  close,
}: {
  sidebarRef: Ref<HTMLElement>;
  collapsed: boolean;
  smallScreen: boolean;
  mobile: boolean;
  toggle: () => void;
  close: () => void;
}) {
  const location = useLocation();
  const [disclosures, setDisclosures] = useState<
    Partial<
      Record<"learning" | "departments", { open: boolean; route: string }>
    >
  >({});
  return (
    <aside
      id="workspace-sidebar"
      ref={sidebarRef}
      inert={smallScreen && !mobile}
      role={mobile ? "dialog" : undefined}
      aria-modal={mobile || undefined}
      aria-label="Навигация ERP"
      className={cn("erp-sidebar", mobile && "erp-sidebar-open")}
    >
      <div className="erp-sidebar-header">
        <Link
          className="erp-sidebar-brand"
          to="/erp"
          aria-label="Young Unicorn, главная ERP"
        >
          <strong>Young Unicorn</strong>
          <span>ERP</span>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="erp-sidebar-toggle"
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          aria-expanded={!collapsed}
          aria-controls="erp-sections"
          onClick={toggle}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="erp-sidebar-close"
          aria-label="Закрыть меню"
          onClick={close}
        >
          <X size={20} />
        </Button>
      </div>
      <nav id="erp-sections" className="erp-sections" aria-label="Разделы ERP">
        {erpNavigation.map(({ title, entries }, index) => (
          <section
            className="erp-nav-group"
            key={title}
            aria-labelledby={`erp-group-${index}`}
          >
            <h2 id={`erp-group-${index}`} className="erp-nav-heading">
              {title}
            </h2>
            <ul>
              {entries.map((entry) => {
                if ("to" in entry) {
                  const active = pageIsActive(entry, location.pathname);
                  return (
                    <li key={entry.to}>
                      <Link
                        to={entry.to}
                        className="erp-nav-item"
                        title={
                          collapsed
                            ? `${entry.label} · ${statusLabel(entry.ready)}`
                            : undefined
                        }
                        aria-current={active ? "page" : undefined}
                      >
                        <entry.icon size={18} aria-hidden="true" />
                        <span className="erp-nav-label">{entry.label}</span>
                        <ErpSectionStatus ready={entry.ready} />
                      </Link>
                    </li>
                  );
                }
                const { id, label, pages } = entry;
                const active = pages.some((page) =>
                  pageIsActive(page, location.pathname),
                );
                const disclosure = disclosures[id];
                const open =
                  !collapsed &&
                  (disclosure?.route === location.key
                    ? disclosure.open
                    : active);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="erp-nav-item"
                      data-active={active || undefined}
                      title={collapsed ? label : undefined}
                      aria-expanded={open}
                      aria-controls={`erp-subnav-${id}`}
                      onClick={() => {
                        if (collapsed) toggle();
                        setDisclosures((current) => ({
                          ...current,
                          [id]: { open: !open, route: location.key },
                        }));
                      }}
                    >
                      <entry.icon size={18} aria-hidden="true" />
                      <span className="erp-nav-label">{label}</span>
                      <ChevronDown
                        className="erp-nav-chevron"
                        size={15}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`erp-subnav-${id}`}
                      className="erp-subnav-motion"
                      data-open={open}
                      inert={!open}
                    >
                      <div className="erp-subnav-clip">
                        <ul className="erp-subnav">
                          {pages.map((page) => (
                            <li key={page.to}>
                              <Link
                                to={
                                  page === erpSections.sales &&
                                  canOpenErpPage(page)
                                    ? salesPages.orders.to
                                    : page.to
                                }
                                aria-current={
                                  pageIsActive(page, location.pathname)
                                    ? "page"
                                    : undefined
                                }
                              >
                                <span>{page.label}</span>
                                <ErpSectionStatus ready={page.ready} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}
