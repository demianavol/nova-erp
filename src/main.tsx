import React, {
  Component,
  Suspense,
  lazy,
  useEffect,
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
import { Toaster } from "sonner";
import { useAuth, usePreferences } from "./data/store";
import { Layout } from "./components/layout";
import { Login } from "./pages/login";
import { Button, Empty } from "./components/ui";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./typography.css";
import "./refinements.css";

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
function App() {
  const theme = usePreferences((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
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
              <span className="loading-symbol">N</span>
              <p>Собираем ваше пространство…</p>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="sales" element={<Dashboard sales />} />
              <Route path="sales/orders" element={<Orders />} />
              <Route path="sales/customers" element={<Customers />} />
              <Route path="sales/pipeline" element={<Pipeline />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="departments/finance" element={<FinancePage />} />
              <Route path="departments/:department" element={<Department />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
      <Toaster richColors position="bottom-right" theme={theme} closeButton />
    </ErrorBoundary>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
