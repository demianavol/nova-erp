import { useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../data/erp-session";
import { Button, PageHeading, SectionHeading } from "../components/ui";

export function SalesNotifications() {
  const [sending, setSending] = useState(false);
  const [messageUrl, setMessageUrl] = useState("");
  const [error, setError] = useState(false);

  async function sendTest() {
    setSending(true);
    setMessageUrl("");
    setError(false);
    try {
      const response = await fetch("/api/sales/telegram-test", {
        method: "POST",
      });
      if (response.status === 401) {
        useAuth.setState({ authenticated: false });
        return;
      }
      if (!response.ok) throw new Error("Telegram test failed");
      const result = await response.json();
      setMessageUrl(result.messageUrl);
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
        description="Проверка доставки сообщений отдела продаж."
      />
      <section className="card">
        <SectionHeading
          title="Telegram"
          description="Тестовое уведомление отправится в тему «Отдел продаж»."
          action={
            import.meta.env.VITE_SALES_TELEGRAM_PILOT && (
              <Button onClick={sendTest} disabled={sending}>
                <Send size={16} />
                {sending ? "Отправляем…" : "Отправить тест в Telegram"}
              </Button>
            )
          }
        />
        {!import.meta.env.VITE_SALES_TELEGRAM_PILOT && (
          <p className="card-footnote">
            Отправка в Telegram пока не настроена.
          </p>
        )}
        {error && (
          <p className="card-footnote" role="alert">
            Не удалось отправить тест в Telegram.
          </p>
        )}
        {messageUrl && (
          <p className="card-footnote" role="status">
            Тест доставлен.{" "}
            <a href={messageUrl} target="_blank" rel="noreferrer">
              Открыть в Telegram
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
