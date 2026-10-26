import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../data/store";
import { Logo } from "../components/layout";
import { Badge, Button, Field, Input } from "../components/ui";

const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
  remember: z.boolean(),
});
export function Login() {
  const { authenticated, login } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false),
    [error, setError] = useState("");
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const destination = (location.state as { from?: string } | null)?.from || "/";
  if (authenticated) return <Navigate to={destination} replace />;
  return (
    <div className="login-page">
      <div className="login-main">
        <header className="login-header">
          <Logo />
        </header>
        <div className="login-form-wrap">
          <Badge tone="violet">
            <span className="live-dot" />
            ВАШЕ РАБОЧЕЕ ПРОСТРАНСТВО
          </Badge>
          <h1>
            С возвращением<span>.</span>
          </h1>
          <p className="login-description">
            Войдите, чтобы быть в ритме вашего бизнеса.
          </p>
          <form
            onSubmit={form.handleSubmit((values) => {
              if (
                values.email.toLowerCase() !== "demo@nova.local" ||
                values.password !== "Demo2026!"
              ) {
                setError(
                  "Неверный email или пароль. Используйте демо-аккаунт ниже.",
                );
                return;
              }
              setError("");
              login(values.remember);
            })}
          >
            <Field
              label="Рабочий email"
              error={form.formState.errors.email?.message}
            >
              <div className="input-with-icon">
                <Mail size={17} />
                <Input
                  autoComplete="username"
                  placeholder="name@company.ru"
                  {...form.register("email")}
                />
              </div>
            </Field>
            <Field
              label="Пароль"
              error={form.formState.errors.password?.message}
            >
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <Input
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <label className="checkbox-label">
              <input type="checkbox" {...form.register("remember")} />
              Запомнить меня
            </label>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="login-submit">
              Войти в пространство
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="login-divider">
            <span />
            или познакомьтесь с NOVA
            <span />
          </div>
          <Button
            variant="outline"
            className="demo-login"
            onClick={() => login(form.getValues("remember"))}
          >
            <Sparkles size={17} />
            Войти в демо-аккаунт
            <ArrowUpRight size={17} />
          </Button>
          <div className="demo-credentials">
            <span>Демо-доступ</span>
            <code>demo@nova.local</code>
            <i>·</i>
            <code>Demo2026!</code>
          </div>
          <p className="login-local-note">
            <ShieldCheck size={14} />
            Демонстрационный вход · Данные сохраняются в браузере
          </p>
        </div>
        <footer className="login-footer">
          <span>© {new Date().getFullYear()} NOVA ERP</span>
          <span>Создано для вашего роста</span>
        </footer>
      </div>
      <section className="login-visual">
        <div className="login-visual-top">
          <span className="visual-brand">
            FORM & HOME
            <span />
          </span>
          <Badge>ЕДИНАЯ ЭКОСИСТЕМА</Badge>
        </div>
        <div className="login-visual-content">
          <div className="login-orbits" aria-hidden="true">
            <div />
            <div />
            <div />
            <span className="login-big-symbol">N</span>
            <span className="login-orbit-chip orbit-chip-1">
              <span>✦</span>Продажи растут
            </span>
            <span className="login-orbit-chip orbit-chip-2">
              <span>
                <Check size={16} />
              </span>
              Команда в одном ритме
            </span>
            <span className="login-orbit-chip orbit-chip-3">
              + ясность в каждом решении
            </span>
          </div>
          <div className="login-visual-copy">
            <span className="eyebrow">МЕНЬШЕ РУТИНЫ. БОЛЬШЕ ВОЗМОЖНОСТЕЙ.</span>
            <h2>
              Большая картина.
              <br />В каждой детали.
            </h2>
            <p>
              Команда, клиенты и продажи —<br />в одном продуманном
              пространстве.
            </p>
          </div>
        </div>
        <div className="login-visual-bottom">
          <span>
            <i />
            Всё связано. Всё под контролем.
          </span>
          <span>✦</span>
        </div>
      </section>
    </div>
  );
}
