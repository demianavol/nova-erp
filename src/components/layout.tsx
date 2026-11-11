import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import {
  Bell,
  Box,
  CalendarDays,
  Check,
  ChevronRight,
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
  ArrowUpRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Toaster } from "sonner";
import { useERP, usePreferences } from "../data/store";
import { useAuth } from "../data/erp-session";
import { readSiteTheme } from "./site-theme";
import { useErpActivity } from "../data/erp-activity";
import { cn, dateLabel, money, today } from "../lib/utils";
import { orderTotal } from "../data/selectors";
import { Avatar, Badge, Button, Dialog, Empty, Input, Menu } from "./ui";
import { EntityDialogs } from "./entity-dialogs";
import { ErpNavigation, SalesNavigation, erpPage } from "./erp-navigation";
import "../refinements.css";
import "../workspace.css";

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
                  route: "/erp/sales/analytics",
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

export function ProtectedLayout() {
  const { authenticated, check } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (authenticated === null) void check();
  }, [authenticated, check]);
  if (authenticated === null)
    return (
      <div className="app-loading" role="status">
        Проверяем доступ…
      </div>
    );
  return authenticated ? (
    <Layout />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search + location.hash }}
      replace
    />
  );
}

function Layout() {
  const preferences = usePreferences(),
    { data, storageError, readNotification } = useERP(),
    logout = useAuth((s) => s.logout);
  const navigate = useNavigate(),
    location = useLocation();
  useLayoutEffect(() => {
    if (location.pathname !== "/erp" || !location.state?.inheritSiteTheme)
      return;
    usePreferences.getState().update({ theme: readSiteTheme() });
    navigate("/erp", { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);
  const navigationType = useNavigationType();
  const visitedErpEntries = useRef(new Set<number>());
  useLayoutEffect(() => {
    const index: unknown = window.history.state?.idx;
    if (typeof index !== "number") return;
    if (navigationType === "PUSH") {
      for (const entry of visitedErpEntries.current) {
        if (entry >= index) visitedErpEntries.current.delete(entry);
      }
    }
    visitedErpEntries.current.add(index);
  }, [location.key, navigationType]);
  const page = erpPage(location.pathname);
  const section = page?.label ?? "ERP";
  const isHome = page?.to === "/erp";
  const path = page?.to;
  const lastPage = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastPage.current === path) return;
    lastPage.current = path;
    if (path && path !== "/erp") useErpActivity.getState().record(path);
  }, [path]);
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [notifications, setNotifications] = useState(false),
    [help, setHelp] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileRoute = useRef<string>(null);
  const pageRef = useRef<HTMLElement>(null);
  const dark = preferences.theme === "dark";
  const themeLabel = dark
    ? "Включить светлую тему ERP"
    : "Включить чёрную тему ERP";
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.erpTheme = preferences.theme;
    return () => {
      delete root.dataset.erpTheme;
    };
  }, [preferences.theme]);
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
  const unread = data.notifications.filter((n) => !n.read).length;
  const isSales = /^\/erp\/sales(?:\/|$)/.test(location.pathname);
  const goBack = () => {
    const index: unknown = window.history.state?.idx;
    if (typeof index === "number" && visitedErpEntries.current.has(index - 1)) {
      navigate(-1);
      return;
    }
    const { pathname, hash } = location;
    let fallback = "/erp";
    if (isSales && !matchPath("/erp/sales/orders", pathname))
      fallback = "/erp/sales/orders";
    if (
      matchPath("/erp/learning/*", pathname) &&
      !matchPath("/erp/learning", pathname)
    )
      fallback = "/erp/learning";
    if (matchPath("/erp/employees", pathname))
      fallback = hash ? "/erp/employees" : "/erp/learning";
    if (matchPath("/erp/tasks/projects", pathname)) fallback = "/erp/tasks";
    navigate(fallback, { replace: true });
  };
  useEffect(() => {
    if (mobile) return;
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [mobile]);
  useEffect(() => {
    setMobile(false);
    pageRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.key]);
  useEffect(() => {
    if (!mobile) return;
    asideRef.current
      ?.querySelector<HTMLButtonElement>(".erp-sidebar-close")
      ?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobile(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        asideRef.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled]),input,select",
        ) || [],
      ).filter(
        (element) =>
          element.offsetParent !== null && !element.closest("[inert]"),
      );
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
    };
  }, [mobile]);
  useEffect(() => {
    if (mobile || mobileRoute.current === null) return;
    const sameRoute = mobileRoute.current === location.key;
    mobileRoute.current = null;
    (sameRoute && smallScreen ? menuButton.current : pageRef.current)?.focus({
      preventScroll: true,
    });
  }, [location.key, mobile, smallScreen]);
  return (
    <div
      className={cn(
        "app-shell erp-shell",
        preferences.collapsed && "erp-nav-collapsed",
      )}
    >
      {smallScreen && (
        <button
          type="button"
          className="erp-sidebar-backdrop"
          data-open={mobile}
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMobile(false)}
        />
      )}
      <ErpNavigation
        sidebarRef={asideRef}
        collapsed={preferences.collapsed && !smallScreen}
        smallScreen={smallScreen}
        mobile={mobile}
        toggle={() => preferences.update({ collapsed: !preferences.collapsed })}
        close={() => setMobile(false)}
      />
      <div className="main-shell" inert={smallScreen && mobile}>
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              ref={menuButton}
              aria-label="Открыть меню"
              aria-expanded={mobile}
              aria-controls="workspace-sidebar"
              onClick={() => {
                mobileRoute.current = location.key;
                setMobile(true);
              }}
            >
              <MenuIcon size={21} />
            </Button>
            {isHome ? (
              <h1
                className="topbar-greeting"
                id="workspace-greeting"
                tabIndex={-1}
              >
                Добрый день, {preferences.name.split(" ")[0]}
                <span>.</span>
              </h1>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="erp-back-button"
                  onClick={goBack}
                  aria-label="Назад"
                  title="Назад"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Назад</span>
                </Button>
                <span className="breadcrumb-home">
                  <LayoutDashboard size={15} aria-hidden="true" />
                  <span>{isSales ? "Продажи" : "Рабочее пространство"}</span>
                </span>
                <ChevronRight
                  size={13}
                  className="erp-breadcrumb-separator"
                  aria-hidden="true"
                />
                <strong title={section}>{section}</strong>
              </>
            )}
          </div>
          <div className="topbar-right">
            <button
              aria-label="Поиск по рабочему пространству"
              aria-haspopup="dialog"
              className="global-search-trigger"
              onClick={() => setSearch(true)}
            >
              <Search size={16} aria-hidden="true" />
              <span>Поиск</span>
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
            <Button
              variant="ghost"
              size="icon"
              className="erp-theme-toggle"
              aria-label={themeLabel}
              title={themeLabel}
              onClick={() =>
                preferences.update({ theme: dark ? "light" : "dark" })
              }
            >
              {dark ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}
            </Button>
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
                  label: "Личный кабинет",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/erp/profile"),
                },
                {
                  label: "Настройки",
                  icon: <Settings2 size={15} />,
                  onClick: () => navigate("/erp/settings"),
                },
                {
                  label: "Помощь и поддержка",
                  icon: <CircleHelp size={15} />,
                  onClick: () => setHelp(true),
                },
                {
                  label: "Выйти из аккаунта",
                  icon: <LogOut size={15} />,
                  onClick: async () => {
                    if (!(await logout())) {
                      useERP.setState({
                        storageError:
                          "Не удалось выйти из ERP. Попробуйте ещё раз.",
                      });
                    }
                  },
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
              <button onClick={() => navigate("/erp/settings")}>
                Настройки
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {isSales && <SalesNavigation />}
          <Suspense
            fallback={
              <p className="muted" role="status">
                Загрузка раздела…
              </p>
            }
          >
            <Outlet />
          </Suspense>
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
              title: "Посмотрите аналитику продаж",
              text: "Выберите период, чтобы посмотреть выручку, заказы и каналы продаж.",
              route: "/erp/sales/analytics",
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
      <Toaster
        richColors
        position="bottom-right"
        theme={preferences.theme}
        closeButton
      />
    </div>
  );
}
function ShieldIcon() {
  return <Box size={17} />;
}
