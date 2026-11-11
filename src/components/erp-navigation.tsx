import { useState, type Ref } from "react";
import { Link, NavLink, matchPath, useLocation } from "react-router-dom";
import {
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
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { departmentNames } from "../data/schema";
import { cn } from "../lib/utils";
import { Button } from "./ui";

type Page = { label: string; to: string };
type Entry = { icon: LucideIcon } & (
  | Page
  | {
      id: "learning" | "departments";
      label: string;
      pages: Page[];
    }
);

const navigation: { title: string; entries: Entry[] }[] = [
  {
    title: "Основное",
    entries: [
      { label: "Главная", to: "/erp", icon: House },
      {
        id: "learning",
        label: "Обучение",
        icon: GraduationCap,
        pages: [
          { label: "С чего начать", to: "/erp/learning/start" },
          { label: "Учебный маршрут", to: "/erp/learning" },
          { label: "Справочник сотрудника", to: "/erp/employees" },
        ],
      },
      {
        id: "departments",
        label: "Отделы",
        icon: Layers3,
        pages: [
          { label: "Продажи", to: "/erp/sales/orders" },
          ...["marketing", "purchasing", "warehouse", "finance"].map((id) => ({
            label: departmentNames[id],
            to: `/erp/departments/${id}`,
          })),
        ],
      },
    ],
  },
  {
    title: "Команда",
    entries: [
      { label: "Сотрудники", to: "/erp/departments/team", icon: Users },
      { label: "Оргструктура", to: "/erp/org-structure", icon: Network },
      { label: "Личный кабинет", to: "/erp/profile", icon: UserRound },
    ],
  },
  {
    title: "Работа",
    entries: [
      { label: "Документы", to: "/erp/documents", icon: FileText },
      { label: "Задачи", to: "/erp/tasks", icon: ListTodo },
    ],
  },
  {
    title: "Система",
    entries: [{ label: "Настройки", to: "/erp/settings", icon: Settings2 }],
  },
];

const salesPages = [
  { label: "Заказы", to: "/erp/sales/orders" },
  { label: "Клиенты", to: "/erp/sales/customers" },
  { label: "Воронка", to: "/erp/sales/pipeline" },
  { label: "Аналитика", to: "/erp/sales/analytics" },
  { label: "Уведомления", to: "/erp/sales/notifications" },
];

const workspacePages: Page[] = [
  ...salesPages,
  { label: "Проекты", to: "/erp/tasks/projects" },
  ...navigation.flatMap(({ entries }) =>
    entries.flatMap((entry) => ("pages" in entry ? entry.pages : [entry])),
  ),
];

function pageIsActive(page: Page, pathname: string) {
  if (page.to === "/erp/sales/orders")
    return Boolean(matchPath("/erp/sales/*", pathname));
  if (page.to === "/erp/tasks")
    return Boolean(matchPath("/erp/tasks/*", pathname));
  if (
    page.to === "/erp/learning" &&
    matchPath("/erp/learning/lesson/:lessonId", pathname)
  )
    return true;
  return Boolean(matchPath(page.to, pathname));
}

export function erpPage(pathname: string) {
  const path = matchPath("/erp/learning/lesson/:lessonId", pathname)
    ? "/erp/learning"
    : pathname;
  return workspacePages.find(({ to }) => matchPath(to, path));
}

export function SalesNavigation() {
  return (
    <nav className="erp-sales-tabs" aria-label="Разделы продаж">
      {salesPages.map(({ to, label }) => (
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
        {navigation.map(({ title, entries }, index) => (
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
                        title={collapsed ? entry.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        <entry.icon size={18} aria-hidden="true" />
                        <span className="erp-nav-label">{entry.label}</span>
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
                                to={page.to}
                                aria-current={
                                  pageIsActive(page, location.pathname)
                                    ? "page"
                                    : undefined
                                }
                              >
                                {page.label}
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
