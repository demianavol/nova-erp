import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";
import { useAuth } from "../data/erp-session";
import { erpAccessMailto, erpAccessSchema } from "../data/erp-access";
import { CompanyBrand } from "../components/company-brand";
import { TechTitleLine, useTechTitleMotion } from "../components/hero-title";
import { OfficeBackdrop } from "../components/office-backdrop";
import { SiteThemeToggle } from "../components/site-theme";
import { Button, Field, Input, Textarea } from "../components/ui";
import "../login.css";

const loginSchema = z.object({
  password: z.string().min(1, "Введите пароль"),
  remember: z.boolean(),
});

function SignInForm({ requestLink }: { requestLink: ReactNode }) {
  const { login, authenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "", remember: true },
  });
  const { errors, isSubmitting } = form.formState;

  if (!import.meta.env.DEV)
    return (
      <>
        <p className="office-card-description">
          Доступ к ERP предоставляется по запросу.
        </p>
        <div className="office-switch office-sign-in-links">{requestLink}</div>
      </>
    );

  return (
    <>
      <form
        className="office-form"
        noValidate
        onChange={() => setError("")}
        onSubmit={form.handleSubmit(async ({ password, remember }) => {
          const status = await login(password, remember);
          if (status === 204) return;
          setError(
            status === 401
              ? "Неверный пароль."
              : status === 429
                ? "Слишком много попыток. Попробуйте через минуту."
                : "Вход сейчас недоступен.",
          );
        })}
      >
        <div className="office-password">
          <Field label="Пароль" error={errors.password?.message}>
            <span className="office-input">
              <LockKeyhole size={16} aria-hidden="true" />
              <Input
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                placeholder=" "
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
            </span>
          </Field>
          <button
            type="button"
            aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <label className="office-remember">
          <input
            className="sr-only"
            type="checkbox"
            {...form.register("remember")}
          />
          <Bookmark
            className="office-remember-mark"
            size={17}
            aria-hidden="true"
          />
          Запомнить меня
        </label>
        {error && (
          <p className="office-error" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="office-submit"
          disabled={isSubmitting || authenticated === null}
        >
          Войти в ERP <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </form>
      <div className="office-switch office-sign-in-links">{requestLink}</div>
    </>
  );
}

const requestFields = [
  {
    name: "name",
    label: "Фамилия и имя",
    placeholder: "Анна Иванова",
    icon: UserRound,
    maxLength: 80,
    autoComplete: "name",
  },
  {
    name: "department",
    label: "Отдел или руководитель",
    placeholder: "Например, отдел продаж",
    icon: Building2,
    maxLength: 120,
  },
  {
    name: "contact",
    label: "Telegram или телефон",
    placeholder: "@username или номер",
    icon: Send,
    maxLength: 48,
  },
] as const;

function AccessRequestForm() {
  const [prepared, setPrepared] = useState(false);
  const form = useForm<z.infer<typeof erpAccessSchema>>({
    resolver: zodResolver(erpAccessSchema),
    defaultValues: { name: "", department: "", contact: "", note: "" },
  });
  const { errors } = form.formState;

  return (
    <form
      className="office-form"
      noValidate
      onChange={() => setPrepared(false)}
      onSubmit={form.handleSubmit((values) => {
        setPrepared(true);
        window.location.href = erpAccessMailto(values);
      })}
    >
      {requestFields.map(({ name, label, icon: Icon, ...input }) => (
        <Field key={name} label={label} error={errors[name]?.message}>
          <span className="office-input">
            <Icon size={16} aria-hidden="true" />
            <Input
              aria-invalid={!!errors[name]}
              {...input}
              {...form.register(name)}
            />
          </span>
        </Field>
      ))}
      <Field label="Комментарий (необязательно)" error={errors.note?.message}>
        <span className="office-input">
          <MessageSquare size={16} aria-hidden="true" />
          <Textarea
            placeholder="К какому разделу нужен доступ"
            rows={2}
            maxLength={300}
            aria-invalid={!!errors.note}
            {...form.register("note")}
          />
        </span>
      </Field>
      <div>
        <Button type="submit" className="office-submit">
          Открыть письмо <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <p className="office-mail-note" role="status">
          {prepared ? "Отправьте заявку из почтового приложения" : ""}
        </p>
      </div>
    </form>
  );
}

export function Login() {
  const { authenticated, check } = useAuth();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const requestMode = search.get("mode") === "request";
  const previousMode = useRef(requestMode);
  const signInHeading = useRef<HTMLHeadingElement>(null);
  const requestHeading = useRef<HTMLHeadingElement>(null);
  const title = {
    motion: useTechTitleMotion(true),
    fontWeight: 800,
    intro: "none",
    nativeMetrics: true,
    clickKick: false,
  } as const;

  useEffect(() => {
    if (authenticated === null) void check();
  }, [authenticated, check]);
  useEffect(() => {
    if (previousMode.current !== requestMode) {
      previousMode.current = requestMode;
      const heading = requestMode ? requestHeading : signInHeading;
      heading.current?.focus({ preventScroll: true });
    }
  }, [requestMode]);

  const requested = (location.state as { from?: string } | null)?.from;
  const destination =
    requested && /^\/erp(?:[/?#]|$)/.test(requested) ? requested : "/erp";
  if (authenticated) return <Navigate to={destination} replace />;

  const signInSearch = new URLSearchParams(search);
  signInSearch.delete("mode");
  search.set("mode", "request");

  const requestLink = (
    <Link
      to={{ search: search.toString(), hash: location.hash }}
      state={location.state}
    >
      Запросить доступ
    </Link>
  );

  return (
    <div className="office-gate">
      <OfficeBackdrop />
      <div className="office-frame">
        <header className="office-header">
          <Link
            className="office-brand"
            to="/"
            aria-label="Young Unicorn — главная"
          >
            <span className="office-brand-mark" aria-hidden="true">
              <CompanyBrand compact /> YUC
            </span>
            <span className="office-brand-label">Digital Office</span>
          </Link>
          <div className="office-nav">
            <Link className="office-home" to="/">
              <ArrowLeft size={15} aria-hidden="true" /> На сайт
            </Link>
            <SiteThemeToggle />
          </div>
        </header>
        <main className="office-main" id="main-content" tabIndex={-1}>
          <div className="office-intro">
            <p className="office-kicker">Рабочее пространство</p>
            <h1>
              <TechTitleLine text="Ваш рабочий день" {...title} />
              <br />
              <TechTitleLine text="начинается" {...title} />{" "}
              <TechTitleLine
                text="здесь"
                {...title}
                className="office-title-accent"
              />
            </h1>
          </div>
          <div className="office-card-stage" data-request={requestMode}>
            <div className="office-card-turn">
              <section
                className="office-card"
                aria-labelledby="office-sign-in-title"
                inert={requestMode}
                aria-hidden={requestMode || undefined}
              >
                <h2 id="office-sign-in-title" ref={signInHeading} tabIndex={-1}>
                  Вход в ERP
                </h2>
                <SignInForm requestLink={requestLink} />
              </section>
              <section
                className="office-card office-card-back"
                aria-labelledby="office-request-title"
                inert={!requestMode}
                aria-hidden={!requestMode || undefined}
              >
                <h2
                  id="office-request-title"
                  ref={requestHeading}
                  tabIndex={-1}
                >
                  Запросить доступ
                </h2>
                <p className="office-card-description">
                  Заявку нужно отправить по почте
                </p>
                <AccessRequestForm />
                <div className="office-switch office-request-back">
                  <Link
                    to={{
                      search: signInSearch.toString(),
                      hash: location.hash,
                    }}
                    state={location.state}
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Вернуться ко входу
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
