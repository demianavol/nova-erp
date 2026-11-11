import React, {
  Component,
  Suspense,
  lazy,
  useLayoutEffect,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Inbox } from "lucide-react";
import { CompanyBrand } from "./components/company-brand";
import { useSiteTheme } from "./components/site-theme";
import { SiteLanguageProvider, useSiteLanguage } from "./lib/site-language";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./typography.css";
import "./brand.css";
import "./erp-shell.css";

const Login = lazy(() =>
  import("./pages/login").then((m) => ({ default: m.Login })),
);
const Protected = /* @__PURE__ */ lazy(() =>
  import("./components/layout").then((m) => ({ default: m.ProtectedLayout })),
);
const Landing = lazy(async () => {
  const { Landing, loadLandingFonts } = await import("./pages/landing");
  await loadLandingFonts();
  return { default: Landing };
});
const Employees = /* @__PURE__ */ lazy(() =>
  import("./pages/employees").then((m) => ({ default: m.Employees })),
);

const Dashboard = /* @__PURE__ */ lazy(() =>
  import("./pages/dashboard").then((m) => ({ default: m.Dashboard })),
);
const SalesNotifications = /* @__PURE__ */ lazy(() =>
  import("./pages/sales-notifications").then((m) => ({
    default: m.SalesNotifications,
  })),
);
const Orders = /* @__PURE__ */ lazy(() =>
  import("./pages/orders").then((m) => ({ default: m.Orders })),
);
const Customers = /* @__PURE__ */ lazy(() =>
  import("./pages/customers").then((m) => ({ default: m.Customers })),
);
const Pipeline = /* @__PURE__ */ lazy(() =>
  import("./pages/pipeline").then((m) => ({ default: m.Pipeline })),
);
const Tasks = /* @__PURE__ */ lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Tasks })),
);
const Projects = /* @__PURE__ */ lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Projects })),
);
const Profile = /* @__PURE__ */ lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Profile })),
);
const ErpHome = /* @__PURE__ */ lazy(() =>
  import("./pages/erp-home").then((m) => ({ default: m.ErpHome })),
);
const FirstSteps = /* @__PURE__ */ lazy(() =>
  import("./pages/erp-sections").then((m) => ({ default: m.FirstSteps })),
);
const ErpLearning = /* @__PURE__ */ lazy(() =>
  import("./pages/erp-learning").then((m) => ({ default: m.ErpLearning })),
);
const Documents = /* @__PURE__ */ lazy(() =>
  import("./pages/erp-sections").then((m) => ({ default: m.Documents })),
);
const OrgStructure = /* @__PURE__ */ lazy(() =>
  import("./pages/erp-sections").then((m) => ({ default: m.OrgStructure })),
);
const Department = /* @__PURE__ */ lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Department })),
);
const Settings = /* @__PURE__ */ lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Settings })),
);
const FinancePage = /* @__PURE__ */ lazy(() =>
  import("./pages/finance").then((m) => ({ default: m.FinancePage })),
);

class ErrorBoundary extends Component<
  { children: ReactNode; t: (source: string) => string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    const { t } = this.props;
    return this.state.failed ? (
      <div className="fatal-error">
        <div className="empty-state">
          <span>
            <Inbox size={26} aria-hidden="true" />
          </span>
          <h3>{t("Не удалось открыть страницу")}</h3>
          <p>
            {t(
              "Перезагрузите приложение. Если ошибка повторится, восстановите демоданные.",
            )}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            {t("Перезагрузить")}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              try {
                localStorage.removeItem("nova-erp-data-v1");
              } catch {
                /* Reload also works without storage. */
              }
              window.location.href = window.location.pathname;
              window.location.reload();
            }}
          >
            {t("Восстановить демоданные")}
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
function LegacyERPRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={`/erp${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}
function SalesIndexRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/erp/sales/analytics${search}${hash}`} replace />;
}
function AppContent({
  isLanding,
  isErp,
}: {
  isLanding: boolean;
  isErp: boolean;
}) {
  const { t } = useSiteLanguage();
  return (
    <ErrorBoundary t={t}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {t("Перейти к содержимому")}
      </a>
      <Suspense
        fallback={
          <div className="app-loading" role="status">
            {!isErp && <CompanyBrand compact />}
            <p className={isLanding ? "sr-only" : undefined}>
              {t("Собираем ваше пространство…")}
            </p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/employees" element={<LegacyERPRedirect />} />
          <Route path="/login" element={<Login />} />
          {import.meta.env.DEV ? (
            <Route path="/erp" element={<Protected />}>
              <Route index element={<ErpHome />} />
              <Route path="sales" element={<SalesIndexRedirect />} />
              <Route path="sales/analytics" element={<Dashboard />} />
              <Route
                path="sales/notifications"
                element={<SalesNotifications />}
              />
              <Route path="sales/orders" element={<Orders />} />
              <Route path="sales/customers" element={<Customers />} />
              <Route path="sales/pipeline" element={<Pipeline />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/projects" element={<Projects />} />
              <Route path="profile" element={<Profile />} />
              <Route path="documents" element={<Documents />} />
              <Route path="org-structure" element={<OrgStructure />} />
              <Route path="employees" element={<Employees />} />
              <Route path="learning/start" element={<FirstSteps />} />
              <Route path="learning" element={<ErpLearning />} />
              <Route
                path="learning/lesson/:lessonId"
                element={<ErpLearning />}
              />
              <Route path="departments/finance" element={<FinancePage />} />
              <Route path="departments/:department" element={<Department />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/erp" replace />} />
            </Route>
          ) : (
            <Route path="/erp/*" element={<Navigate to="/login" replace />} />
          )}
          {["sales", "tasks", "departments", "settings"].map((path) => (
            <Route
              key={path}
              path={`/${path}/*`}
              element={<LegacyERPRedirect />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
function LocalizedApp() {
  const { pathname } = useLocation();
  const isErp = /^\/erp(?:\/|$)/i.test(pathname);
  const isLanding = pathname === "/";
  const isLogin = /^\/login\/*$/i.test(pathname);
  useLayoutEffect(() => {
    if (!isErp) delete document.documentElement.dataset.erpTheme;
  }, [isErp]);
  useSiteTheme(isLanding ? "landing" : isLogin ? "login" : null);
  return (
    <SiteLanguageProvider enabled={isLanding}>
      <AppContent isLanding={isLanding} isErp={isErp} />
    </SiteLanguageProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <LocalizedApp />
    </HashRouter>
  </React.StrictMode>,
);
