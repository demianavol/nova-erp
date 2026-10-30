import React, { Component, Suspense, lazy, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./data/store";
import { Layout } from "./components/layout";
import { Login } from "./pages/login";
import { Button, Empty } from "./components/ui";
import { CompanyBrand } from "./components/company-brand";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./typography.css";
import "./refinements.css";
import "./workspace.css";
import "./brand.css";

const Landing = lazy(() =>
  import("./pages/landing").then((m) => ({ default: m.Landing })),
);
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
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <Empty
          title="Не удалось открыть страницу"
          description="Перезагрузите приложение. Если ошибка повторится, восстановите демоданные."
          action={
            <>
              <Button onClick={() => window.location.reload()}>
                Перезагрузить
              </Button>
              <Button
                variant="outline"
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
                Восстановить демоданные
              </Button>
            </>
          }
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
function Protected() {
  const authenticated = useAuth((s) => s.authenticated),
    location = useLocation();
  return authenticated ? (
    <Layout />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
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
function App() {
  return (
    <ErrorBoundary>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Перейти к содержимому
      </a>
      <HashRouter>
        <Suspense
          fallback={
            <div className="app-loading">
              <CompanyBrand compact />
              <p>Собираем ваше пространство…</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/login" element={<Login />} />
            <Route path="/erp" element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="sales" element={<Dashboard sales />} />
              <Route path="sales/orders" element={<Orders />} />
              <Route path="sales/customers" element={<Customers />} />
              <Route path="sales/pipeline" element={<Pipeline />} />
              <Route path="tasks" element={<Tasks />} />
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
      </HashRouter>
      <Toaster richColors position="bottom-right" theme="light" closeButton />
    </ErrorBoundary>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
