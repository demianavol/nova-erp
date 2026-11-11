import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../data/erp-session";
import { salesNotificationLimits } from "../data/sales-notification";
import {
  Button,
  Field,
  Input,
  PageHeading,
  SectionHeading,
  Textarea,
} from "../components/ui";

export function SalesNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messageUrl, setMessageUrl] = useState("");
  const [error, setError] = useState(false);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setMessageUrl("");
    setError(false);
    try {
      const response = await fetch("/api/sales/telegram-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      if (response.status === 401) {
        useAuth.setState({ authenticated: false });
        return;
      }
      if (!response.ok) throw new Error("Telegram delivery failed");
      const result = await response.json();
      setMessageUrl(result.messageUrl);
      setTitle("");
      setMessage("");
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sales-dashboard">
      <PageHeading
        eyebrow="ОТДЕЛ ПРОДАЖ"
        title="Уведомления"
        description="Объявления для отдела продаж."
      />
      <section className="card">
        <SectionHeading
          title="Telegram"
          description="Получатель — тема «Отдел продаж»."
        />
        {import.meta.env.VITE_SALES_TELEGRAM_PILOT ? (
          <form className="sales-notification-form" onSubmit={sendNotification}>
            <Field label="Заголовок (необязательно)">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, Планёрка отдела"
                maxLength={salesNotificationLimits.title}
                disabled={sending}
              />
            </Field>
            <Field label="Сообщение">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Например, завтра встречаемся в 11:00"
                maxLength={salesNotificationLimits.message}
                rows={5}
                required
                disabled={sending}
              />
            </Field>
            <div className="sales-notification-actions">
              <Button type="submit" disabled={sending || !message.trim()}>
                <Send size={16} aria-hidden="true" />
                {sending ? "Отправляем…" : "Отправить в Telegram"}
              </Button>
              {error && (
                <span role="alert" className="field-error">
                  Не удалось отправить уведомление.
                </span>
              )}
              {messageUrl && (
                <span role="status">
                  Уведомление доставлено.{" "}
                  <a href={messageUrl} target="_blank" rel="noreferrer">
                    Открыть в Telegram
                  </a>
                </span>
              )}
            </div>
          </form>
        ) : (
          <p className="card-footnote">
            Отправка в Telegram пока не настроена.
          </p>
        )}
      </section>
    </div>
  );
}
