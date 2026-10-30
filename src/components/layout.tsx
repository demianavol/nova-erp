import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  Box,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  PanelLeftOpen,
  CircleHelp,
  Command,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu as MenuIcon,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
  ArrowUpRight,
  Megaphone,
  Truck,
  Package,
  AlertCircle,
} from "lucide-react";
import { useAuth, useERP, usePreferences } from "../data/store";
import { cn, dateLabel, money, today } from "../lib/utils";
import { orderTotal } from "../data/selectors";
import { Avatar, Badge, Button, Dialog, Empty, Input, Menu } from "./ui";
import { ProjectNavigation } from "./project-navigation";
import { EntityDialogs } from "./entity-dialogs";
import { CompanyBrand } from "./company-brand";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <CompanyBrand compact={compact} />;
}
const nav = [
  { to: "/erp", label: "Обзор", icon: LayoutDashboard, end: true },
  { to: "/erp/sales", label: "Продажи", icon: ShoppingBag, end: false },
  { to: "/erp/departments/marketing", label: "Маркетинг", icon: Megaphone },
  { to: "/erp/departments/purchasing", label: "Закупки", icon: Truck },
  { to: "/erp/departments/warehouse", label: "Склад", icon: Package },
  { to: "/erp/departments/finance", label: "Финансы", icon: Wallet },
  { to: "/erp/departments/team", label: "Команда", icon: Users },
];
function GlobalSearch({ open, close }: { open: boolean; close: () => void }) {
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();
  const result = q
    ? [
        ...data.orders
          .filter((o) =>
            `${o.number} ${data.customers.find((c) => c.id === o.customerId)?.name}`
              .toLowerCase()
              .includes(q),
          )
          .slice(0, 5)
          .map((o) => ({
            id: o.id,
            name: o.number,
            sub: `${data.customers.find((c) => c.id === o.customerId)?.name} · ${money(orderTotal(o))}`,
            route: `/erp/sales/orders?open=${o.id}`,
            type: "Заказ",
            icon: ShoppingBag,
          })),
        ...data.customers
          .filter((c) =>
            `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            name: c.name,
            sub: c.email,
            route: `/erp/sales/customers?open=${c.id}`,
            type: "Клиент",
            icon: Users,
          })),
        ...data.deals
          .filter((d) => d.title.toLowerCase().includes(q))
          .slice(0, 5)
          .map((d) => ({
            id: d.id,
            name: d.title,
            sub: data.customers.find((c) => c.id === d.customerId)?.name,
            route: `/erp/sales/pipeline?open=${d.id}`,
            type: "Сделка",
            icon: Target,
          })),
        ...data.tasks
          .filter((t) => t.title.toLowerCase().includes(q))
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            name: t.title,
            sub: "Задача команды",
            route: `/erp/tasks?open=${t.id}`,
            type: "Задача",
            icon: ListTodo,
          })),
      ]
    : [];
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
      title="Поиск в рабочем пространстве"
      description="Заказы, клиенты, сделки и задачи"
    >
      <div className="global-search-body">
        <div className="search-input large">
          <Search size={18} />
          <Input
            autoFocus
            placeholder="Начните вводить название или номер…"
            aria-label="Глобальный поиск"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-results">
          {!q ? (
            <div className="search-suggestions">
              <span>Быстрые переходы</span>
              {[
                {
                  title: "Аналитика продаж",
                  route: "/erp/sales",
                  icon: Target,
                },
                {
                  title: "Все заказы",
                  route: "/erp/sales/orders",
                  icon: ShoppingBag,
                },
                {
                  title: "Задачи команды",
                  route: "/erp/tasks",
                  icon: ListTodo,
                },
              ].map((item) => (
                <button
                  key={item.route}
                  onClick={() => {
                    close();
                    navigate(item.route);
                  }}
                >
                  <item.icon size={18} />
                  {item.title}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          ) : result.length ? (
            result.map((r) => (
              <button
                className="search-result"
                key={r.id}
                onClick={() => {
                  close();
                  navigate(r.route);
                }}
              >
                <span className="soft-violet icon-box">
                  <r.icon size={17} />
                </span>
                <div>
                  <strong>{r.name}</strong>
                  <span>{r.sub}</span>
                </div>
                <Badge>{r.type}</Badge>
                <ArrowUpRight size={15} />
              </button>
            ))
          ) : (
            <Empty
              title="Ничего не найдено"
              description="Попробуйте имя клиента, номер заказа или название задачи."
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function Layout() {
  const preferences = usePreferences(),
    { data, storageError, readNotification } = useERP(),
    logout = useAuth((s) => s.logout);
  const navigate = useNavigate(),
    location = useLocation();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [notifications, setNotifications] = useState(false),
    [help, setHelp] = useState(false),
    [company, setCompany] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const [smallScreen, setSmallScreen] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => {
      setSmallScreen(media.matches);
      if (!media.matches) setMobile(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const unread = data.notifications.filter((n) => !n.read).length,
    isSales = location.pathname.startsWith("/erp/sales"),
    pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((v) => !v);
      }
      if (event.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    setMobile(false);
    pageRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.key]);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement;
    asideRef.current
      ?.querySelector<HTMLButtonElement>(".mobile-close")
      ?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(
        asideRef.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled]),input,select",
        ) || [],
      ).filter((element) => element.offsetParent !== null);
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", trap);
      requestAnimationFrame(() => previous?.focus());
    };
  }, [mobile]);
  const section = location.pathname.includes("orders")
    ? "Заказы"
    : location.pathname.includes("customers")
      ? "Клиенты"
      : location.pathname.includes("pipeline")
        ? "Воронка продаж"
        : location.pathname === "/erp/sales"
          ? "Аналитика"
          : location.pathname === "/erp/tasks"
            ? "Задачи"
            : location.pathname === "/erp/settings"
              ? "Настройки"
              : location.pathname.includes("departments")
                ? nav.find((n) => n.to === location.pathname)?.label || "Отдел"
                : "Обзор";
  return (
    <div
      className={cn("app-shell", preferences.collapsed && "sidebar-collapsed")}
    >
      <nav className="app-rail" aria-label="Быстрые переходы">
        <Link
          to="/erp"
          className="rail-brand"
          aria-label="Young Unicorn — обзор"
        >
          <Logo compact />
        </Link>
        {preferences.collapsed && (
          <button
            className="rail-expand"
            aria-label="Развернуть навигацию"
            aria-expanded={false}
            aria-controls="workspace-sidebar"
            title="Открыть проекты и навигацию"
            onClick={() => preferences.update({ collapsed: false })}
          >
            <PanelLeftOpen size={19} />
            <span>Проекты</span>
          </button>
        )}
        <div className="rail-links">
          {[
            ...nav,
            { to: "/erp/tasks", label: "Задачи", icon: ListTodo, end: true },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon size={20} />
            </NavLink>
          ))}
        </div>
        <NavLink to="/erp/settings" aria-label="Настройки" title="Настройки">
          <Settings2 size={20} />
        </NavLink>
      </nav>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть навигацию"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="workspace-sidebar"
        ref={asideRef}
        inert={smallScreen && !mobile}
        role={smallScreen && mobile ? "dialog" : undefined}
        aria-modal={smallScreen && mobile ? true : undefined}
        aria-label="Навигация"
        className={cn("sidebar", mobile && "sidebar-mobile-open")}
      >
        <div className="sidebar-brand">
          <strong className="sidebar-title">Проекты</strong>
          <Button
            variant="ghost"
            size="icon"
            className="sidebar-collapse"
            aria-label={
              preferences.collapsed
                ? "Развернуть навигацию"
                : "Свернуть навигацию"
            }
            onClick={() =>
              preferences.update({ collapsed: !preferences.collapsed })
            }
          >
            <ChevronsLeft size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mobile-close"
            aria-label="Закрыть меню"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="mobile-sections" aria-label="Разделы портала">
          {[
            ...nav,
            { to: "/erp/tasks", label: "Задачи", icon: ListTodo, end: true },
            {
              to: "/erp/settings",
              label: "Настройки",
              icon: Settings2,
              end: true,
            },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobile(false)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <ProjectNavigation />
        <div className="sidebar-bottom">
          {!preferences.promoHidden && (
            <button className="sidebar-intro" onClick={() => setHelp(true)}>
              <Sparkles size={14} />
              Знакомство с ERP
              <ArrowUpRight size={12} />
            </button>
          )}
          <div className="sidebar-utility">
            <button title="Справка" onClick={() => setHelp(true)}>
              <CircleHelp size={17} />
              <span>Помощь и поддержка</span>
            </button>
          </div>
          <div className="sidebar-profile">
            <Avatar name={preferences.name} />
            <button
              onClick={() => navigate("/erp/settings")}
              title="Настройки профиля"
            >
              <strong>{preferences.name}</strong>
              <span>{preferences.role}</span>
            </button>
            <Menu
              trigger={
                <Button variant="ghost" size="icon" aria-label="Меню профиля">
                  <ChevronDown size={14} />
                </Button>
              }
              items={[
                {
                  label: "О компании",
                  icon: <Building2 size={15} />,
                  onClick: () => setCompany(true),
                },
                {
                  label: "Настройки профиля",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/erp/settings"),
                },
                { label: "Выйти", icon: <LogOut size={15} />, onClick: logout },
              ]}
            />
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={smallScreen && mobile}>
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Открыть меню"
              onClick={() => setMobile(true)}
            >
              <MenuIcon size={21} />
            </Button>
            {location.pathname === "/erp" ? (
              <h1
                className="topbar-greeting"
                id="workspace-greeting"
                title={`Добрый день, ${preferences.name.split(" ")[0]}`}
              >
                Добрый день, {preferences.name.split(" ")[0]}
                <span>.</span>
              </h1>
            ) : (
              <>
                <span className="breadcrumb-home">
                  <LayoutDashboard size={15} />
                  <span>Рабочее пространство</span>
                </span>
                <ChevronRight size={13} />
                <strong>
                  {isSales && section !== "Аналитика" ? "Продажи" : section}
                </strong>
                {isSales && section !== "Аналитика" && (
                  <>
                    <ChevronRight size={13} />
                    <span>{section}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="topbar-right">
            <button
              aria-label="Поиск по рабочему пространству"
              className="global-search-trigger"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>Поиск в пространстве…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-date">
              <CalendarDays size={14} />
              {dateLabel(today(), true)}
            </span>
            <Menu
              trigger={
                <Button variant="ghost" size="icon" aria-label="Создать запись">
                  <Plus size={18} />
                </Button>
              }
              items={[
                {
                  label: "Новый заказ",
                  icon: <ShoppingBag size={15} />,
                  onClick: () => navigate("/erp/sales/orders?create=1"),
                },
                {
                  label: "Новая задача",
                  icon: <ListTodo size={15} />,
                  onClick: () => navigate("/erp/tasks?create=1"),
                },
                {
                  label: "Новая сделка",
                  icon: <Target size={15} />,
                  onClick: () => navigate("/erp/sales/pipeline?create=1"),
                },
              ]}
            />
            <span className="topbar-divider" />
            <button
              className="notifications-button"
              aria-label={`Уведомления: ${unread} непрочитанных`}
              onClick={() => setNotifications(true)}
            >
              <Bell size={19} />
              {unread > 0 && <span />}
            </button>
            <Menu
              trigger={
                <button
                  className="topbar-avatar"
                  aria-label="Открыть меню пользователя"
                >
                  <Avatar name={preferences.name} size="sm" />
                </button>
              }
              label={preferences.name}
              items={[
                {
                  label: "Сайт компании",
                  icon: <ArrowUpRight size={15} />,
                  onClick: () => navigate("/"),
                },
                {
                  label: "Профиль и настройки",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/erp/settings"),
                },
                {
                  label: "Выйти из аккаунта",
                  icon: <LogOut size={15} />,
                  onClick: logout,
                  danger: true,
                },
              ]}
            />
          </div>
        </header>
        <main
          ref={pageRef}
          tabIndex={-1}
          className="page-content"
          id="main-content"
          aria-labelledby={
            location.pathname === "/erp" ? "workspace-greeting" : undefined
          }
        >
          {storageError && (
            <div role="alert" className="storage-warning">
              <AlertCircle size={18} />
              <span>{storageError}</span>
              <button onClick={() => navigate("/erp/settings")}>
                Настройки
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <EntityDialogs />
      <GlobalSearch
        key={search ? "open" : "closed"}
        open={search}
        close={() => setSearch(false)}
      />
      <Dialog
        open={notifications}
        onOpenChange={setNotifications}
        title="Уведомления"
        description={`${unread} непрочитанных · События вашего рабочего пространства`}
      >
        <div className="notification-toolbar">
          <Button
            variant="ghost"
            size="sm"
            disabled={!unread}
            onClick={() => readNotification()}
          >
            <Check size={14} />
            Прочитать все
          </Button>
        </div>
        <div className="notification-list">
          {data.notifications.length ? (
            data.notifications.map((n) => (
              <button
                key={n.id}
                className={cn("notification-item", !n.read && "unread")}
                onClick={() => {
                  readNotification(n.id);
                  setNotifications(false);
                  navigate(n.route);
                }}
              >
                <span
                  className={cn(
                    "icon-box",
                    n.type === "order"
                      ? "soft-violet"
                      : n.type === "task"
                        ? "soft-orange"
                        : "soft-blue",
                  )}
                >
                  {n.type === "order" ? (
                    <ShoppingBag size={18} />
                  ) : n.type === "task" ? (
                    <ListTodo size={18} />
                  ) : (
                    <Bell size={18} />
                  )}
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.description}</p>
                  <span>{dateLabel(n.createdAt)}</span>
                </div>
                {!n.read && <i />}
              </button>
            ))
          ) : (
            <Empty
              title="Всё спокойно"
              description="Новые события появятся здесь."
            />
          )}
        </div>
      </Dialog>
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title="Рабочее пространство Young Unicorn"
        description="Короткий маршрут по вашей первой ERP"
      >
        <div className="help-body">
          <div className="help-intro">
            <span className="soft-violet icon-box">
              <Sparkles size={23} />
            </span>
            <p>
              Единое пространство для команды, клиентов и продаж Young Unicorn.
            </p>
          </div>
          {[
            {
              n: "01",
              title: "Посмотрите на бизнес целиком",
              text: "Обзор показывает выручку, заказы, задачи и события.",
              route: "/erp",
            },
            {
              n: "02",
              title: "Пройдите путь клиента",
              text: "Создайте клиента, добавьте сделку и переведите её в заказ.",
              route: "/erp/sales/customers",
            },
            {
              n: "03",
              title: "Сфокусируйте команду",
              text: "Назначайте задачи, сроки и ответственных.",
              route: "/erp/tasks",
            },
          ].map((step) => (
            <button
              className="help-step"
              key={step.n}
              onClick={() => {
                setHelp(false);
                navigate(step.route);
              }}
            >
              <span>{step.n}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
          <div className="demo-disclaimer">
            <ShieldIcon />
            Это демоверсия. Данные хранятся в браузере, реальных платежей и
            внешних интеграций нет.
          </div>
        </div>
      </Dialog>
      <Dialog
        open={company}
        onOpenChange={setCompany}
        title="Young Unicorn"
        description="Продукты, медиа и команда в одном пространстве"
      >
        <div className="dialog-body company-overview">
          <span className="company-label">
            <Building2 size={18} />
            E-commerce · Fashion · Self-care
          </span>
          <p>
            Young Unicorn создаёт и развивает бренды в e-commerce. В этой
            демоверсии ERP показаны примеры работы с командой, продажами и
            финансами.
          </p>
          <div className="mini-stats">
            <div>
              <span>Сотрудников</span>
              <strong>{data.employees.length}</strong>
            </div>
            <div>
              <span>Товаров</span>
              <strong>{data.products.length}</strong>
            </div>
            <div>
              <span>Клиентов</span>
              <strong>{data.customers.length}</strong>
            </div>
          </div>
          <div className="company-lead">
            <Avatar name={preferences.name} size="lg" />
            <div>
              <strong>{preferences.name}</strong>
              <span>{preferences.role}</span>
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <Button
            variant="outline"
            onClick={() => {
              setCompany(false);
              navigate("/erp/departments/team");
            }}
          >
            Команда
            <Users size={15} />
          </Button>
          <Button
            onClick={() => {
              setCompany(false);
              navigate("/erp/departments/finance");
            }}
          >
            Финансы компании
            <ArrowUpRight size={15} />
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
function ShieldIcon() {
  return <Box size={17} />;
}
