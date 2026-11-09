import React, { Component, Suspense, lazy, type ReactNode } from "react";
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
import { SiteLanguageProvider, useSiteLanguage } from "./lib/site-language";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./typography.css";
import "./brand.css";

const Login = lazy(() =>
  import("./pages/login").then((m) => ({ default: m.Login })),
);
const Protected = lazy(() =>
  import("./components/layout").then((m) => ({ default: m.ProtectedLayout })),
);
const Landing = lazy(async () => {
  const { Landing, loadLandingFonts } = await import("./pages/landing");
  await loadLandingFonts();
  return { default: Landing };
});
const Employees = lazy(() =>
  import("./pages/employees").then((m) => ({ default: m.Employees })),
);

const Dashboard = lazy(() =>
  import("./pages/dashboard").then((m) => ({ default: m.Dashboard })),
);
const Orders = lazy(() =>
  import("./pages/orders").then((m) => ({ default: m.Orders })),
);
const Customers = lazy(() =>
  import("./pages/customers").then((m) => ({ default: m.Customers })),
);
const Pipeline = lazy(() =>
  import("./pages/pipeline").then((m) => ({ default: m.Pipeline })),
);
const Tasks = lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Tasks })),
);
const Department = lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Department })),
);
const Settings = lazy(() =>
  import("./pages/workspace").then((m) => ({ default: m.Settings })),
);
const FinancePage = lazy(() =>
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
function AppContent({ isLanding }: { isLanding: boolean }) {
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
            <CompanyBrand compact />
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
          <Route path="/erp" element={<Protected />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Dashboard sales />} />
            <Route path="sales/orders" element={<Orders />} />
            <Route path="sales/customers" element={<Customers />} />
            <Route path="sales/pipeline" element={<Pipeline />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="employees" element={<Employees />} />
            <Route path="departments/finance" element={<FinancePage />} />
            <Route path="departments/:department" element={<Department />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/erp" replace />} />
          </Route>
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
  const isLanding = pathname === "/";
  return (
    <SiteLanguageProvider enabled={isLanding}>
      <AppContent isLanding={isLanding} />
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
