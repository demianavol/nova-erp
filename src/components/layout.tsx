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
  CircleHelp,
  Command,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Sun,
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
import { cn, dateLabel, money } from "../lib/utils";
import { orderTotal } from "../data/selectors";
import { Avatar, Badge, Button, Dialog, Empty, Input, Menu } from "./ui";
import { EntityDialogs } from "./entity-dialogs";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7 24V8h5l8 10V8h5v16h-5L12 14v10H7Z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <>
          <strong>NOVA</strong>
          <span className="brand-tag">ERP</span>
        </>
      )}
    </span>
  );
}
const nav = [
  { to: "/", label: "Обзор", icon: LayoutDashboard, end: true },
  { to: "/sales", label: "Продажи", icon: ShoppingBag, end: false },
  { to: "/departments/marketing", label: "Маркетинг", icon: Megaphone },
  { to: "/departments/purchasing", label: "Закупки", icon: Truck },
  { to: "/departments/warehouse", label: "Склад", icon: Package },
  { to: "/departments/finance", label: "Финансы", icon: Wallet },
  { to: "/departments/team", label: "Команда", icon: Users },
];
const subnav = [
  { to: "/sales", label: "Аналитика" },
  { to: "/sales/orders", label: "Заказы" },
  { to: "/sales/customers", label: "Клиенты" },
  { to: "/sales/pipeline", label: "Воронка" },
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
            route: `/sales/orders?open=${o.id}`,
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
            route: `/sales/customers?open=${c.id}`,
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
            route: `/sales/pipeline?open=${d.id}`,
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
            route: `/tasks?open=${t.id}`,
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
                { title: "Аналитика продаж", route: "/sales", icon: Target },
                {
                  title: "Все заказы",
                  route: "/sales/orders",
                  icon: ShoppingBag,
                },
                { title: "Задачи команды", route: "/tasks", icon: ListTodo },
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
    isSales = location.pathname.startsWith("/sales"),
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
  }, [location.pathname]);
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
        : location.pathname === "/sales"
          ? "Аналитика"
          : location.pathname === "/tasks"
            ? "Задачи"
            : location.pathname === "/settings"
              ? "Настройки"
              : location.pathname.includes("departments")
                ? nav.find((n) => n.to === location.pathname)?.label || "Отдел"
                : "Обзор";
  return (
    <div
      className={cn("app-shell", preferences.collapsed && "sidebar-collapsed")}
    >
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть навигацию"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        ref={asideRef}
        inert={smallScreen && !mobile}
        role={smallScreen && mobile ? "dialog" : undefined}
        aria-modal={smallScreen && mobile ? true : undefined}
        aria-label="Навигация"
        className={cn("sidebar", mobile && "sidebar-mobile-open")}
      >
        <div className="sidebar-brand">
          <Link to="/" aria-label="NOVA — на главную">
            <Logo compact={preferences.collapsed && !mobile} />
          </Link>
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
        <button
          className="workspace-switch"
          onClick={() => setCompany(true)}
          title="Информация о компании FORM & HOME"
          aria-label="О компании FORM & HOME"
        >
          <span className="workspace-avatar">
            f<span>.</span>
          </span>
          <span className="workspace-text">
            <strong>FORM & HOME</strong>
            <small>Информация о компании</small>
          </span>
          <Building2 size={14} />
        </button>
        <div className="sidebar-nav-area">
          <div className="nav-section-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <nav aria-label="Основная навигация">
            {nav.map((item) => (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    cn("nav-link", isActive && "active")
                  }
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                  {item.to === "/sales" && (
                    <ChevronDown
                      size={14}
                      className={cn("nav-chevron", !isSales && "closed")}
                    />
                  )}
                  {item.to === "/" && <span className="nav-active-dot" />}
                </NavLink>
                {item.to === "/sales" && isSales && (
                  <div className="subnav">
                    {subnav.map((sub) => (
                      <NavLink
                        to={sub.to}
                        key={sub.to}
                        end
                        className={({ isActive }) => cn(isActive && "active")}
                      >
                        <span />
                        {sub.label}
                        {sub.to.endsWith("orders") && (
                          <small>
                            {
                              data.orders.filter((o) => o.shipping === "new")
                                .length
                            }
                          </small>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="nav-section-label tools-label">ИНСТРУМЕНТЫ</div>
          <NavLink
            to="/tasks"
            title="Задачи"
            className={({ isActive }) => cn("nav-link", isActive && "active")}
          >
            <ListTodo size={19} />
            <span>Задачи</span>
            <small className="task-nav-count">
              {data.tasks.filter((t) => !t.done).length}
            </small>
          </NavLink>
          <NavLink
            to="/settings"
            title="Настройки"
            className={({ isActive }) => cn("nav-link", isActive && "active")}
          >
            <Settings2 size={19} />
            <span>Настройки</span>
          </NavLink>
        </div>
        <div className="sidebar-bottom">
          {!preferences.promoHidden && (
            <div className="sidebar-promo">
              <button
                className="promo-dismiss"
                aria-label="Скрыть блок знакомства с NOVA"
                title="Скрыть блок"
                onClick={() => preferences.update({ promoHidden: true })}
              >
                <X size={13} />
              </button>
              <span>
                <Sparkles size={17} />
                Больше ясности.
              </span>
              <strong>Больше возможностей.</strong>
              <p>Ваш бизнес в одном ритме.</p>
              <button onClick={() => setHelp(true)}>
                Знакомство с NOVA
                <ArrowUpRight size={14} />
              </button>
              <div className="promo-orbit" />
            </div>
          )}
          <div className="sidebar-utility">
            <button title="Справка" onClick={() => setHelp(true)}>
              <CircleHelp size={17} />
              <span>Помощь и поддержка</span>
            </button>
            <button
              title={
                preferences.theme === "light" ? "Тёмная тема" : "Светлая тема"
              }
              aria-label="Переключить тему"
              onClick={() =>
                preferences.update({
                  theme: preferences.theme === "light" ? "dark" : "light",
                })
              }
            >
              {preferences.theme === "light" ? (
                <Moon size={17} />
              ) : (
                <Sun size={17} />
              )}
            </button>
          </div>
          <div className="sidebar-profile">
            <Avatar name={preferences.name} />
            <button
              onClick={() => navigate("/settings")}
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
                  label: "Настройки профиля",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/settings"),
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
          </div>
          <div className="topbar-right">
            <button
              aria-label="Поиск по рабочему пространству"
              className="global-search-trigger"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>Найти что-нибудь…</span>
              <kbd>Ctrl K</kbd>
            </button>
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
                  label: "Профиль и настройки",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/settings"),
                },
                {
                  label: "Переключить тему",
                  icon: <Moon size={15} />,
                  onClick: () =>
                    preferences.update({
                      theme: preferences.theme === "light" ? "dark" : "light",
                    }),
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
        >
          {storageError && (
            <div role="alert" className="storage-warning">
              <AlertCircle size={18} />
              <span>{storageError}</span>
              <button onClick={() => navigate("/settings")}>
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
        title="Добро пожаловать в NOVA"
        description="Короткий маршрут по вашей первой ERP"
      >
        <div className="help-body">
          <div className="help-intro">
            <span className="soft-violet icon-box">
              <Sparkles size={23} />
            </span>
            <p>
              Единое пространство для команды, клиентов и продаж FORM & HOME.
            </p>
          </div>
          {[
            {
              n: "01",
              title: "Посмотрите на бизнес целиком",
              text: "Обзор показывает выручку, заказы, задачи и события.",
              route: "/",
            },
            {
              n: "02",
              title: "Пройдите путь клиента",
              text: "Создайте клиента, добавьте сделку и переведите её в заказ.",
              route: "/sales/customers",
            },
            {
              n: "03",
              title: "Сфокусируйте команду",
              text: "Назначайте задачи, сроки и ответственных.",
              route: "/tasks",
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
        title="FORM & HOME"
        description="Компания в вашем рабочем пространстве NOVA"
      >
        <div className="dialog-body company-overview">
          <span className="company-label">
            <Building2 size={18} />
            E-commerce · Товары для дома
          </span>
          <p>
            Здесь указана компания, для которой открыта ERP. Все разделы,
            сотрудники и показатели относятся к FORM & HOME.
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
              navigate("/departments/team");
            }}
          >
            Команда
            <Users size={15} />
          </Button>
          <Button
            onClick={() => {
              setCompany(false);
              navigate("/departments/finance");
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
