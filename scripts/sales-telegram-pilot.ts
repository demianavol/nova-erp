import type { Plugin } from "vite";
import type { IncomingMessage } from "node:http";
import { salesNotificationSchema } from "../src/data/sales-notification";

export function salesTelegramPilot({
  token,
  chatId,
  threadId,
  authenticated,
  isLocalPost,
}: {
  token?: string;
  chatId?: string;
  threadId?: string;
  authenticated: (req: IncomingMessage) => boolean;
  isLocalPost: (req: IncomingMessage) => boolean;
}): Plugin {
  const enabled = Boolean(
    token &&
    /^\d+:[\w-]+$/.test(token) &&
    chatId &&
    /^-100\d+$/.test(chatId) &&
    threadId &&
    /^[1-9]\d*$/.test(threadId),
  );
  let sending = false;

  return {
    name: "sales-telegram-pilot",
    apply: "serve",
    config: () => ({
      define: {
        "import.meta.env.VITE_SALES_TELEGRAM_PILOT": JSON.stringify(enabled),
      },
    }),
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use(
        "/api/sales/telegram-notification",
        async (req, res) => {
          if (!isLocalPost(req)) {
            res.writeHead(403).end();
            return;
          }
          if (req.method !== "POST") {
            res.writeHead(405, { Allow: "POST" }).end();
            return;
          }
          if (!authenticated(req)) {
            res.writeHead(401).end();
            return;
          }
          if (sending) {
            res.writeHead(409).end();
            return;
          }
          sending = true;
          try {
            let body = "";
            req.setEncoding("utf8");
            for await (const chunk of req) {
              body += chunk;
              if (body.length > 16_000) {
                res.writeHead(413).end();
                return;
              }
            }
            let parsed: unknown;
            try {
              parsed = JSON.parse(body);
            } catch {
              res.writeHead(400).end();
              return;
            }
            const draft = salesNotificationSchema.safeParse(parsed);
            if (!draft.success) {
              res.writeHead(400).end();
              return;
            }
            const title = draft.data.title || "Отдел продаж";
            const response = await fetch(
              `https://api.telegram.org/bot${token}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: Number(chatId),
                  message_thread_id: Number(threadId),
                  text: `${title}\n\n${draft.data.message}`,
                  entities: [{ type: "bold", offset: 0, length: title.length }],
                  link_preview_options: { is_disabled: true },
                }),
                signal: AbortSignal.timeout(10000),
              },
            );
            const payload = await response.json();
            if (!response.ok || !payload.ok) {
              server.config.logger.warn(
                `Уведомление отдела продаж: Telegram вернул ошибку ${response.status}.`,
              );
              res.writeHead(502).end();
              return;
            }
            const message = payload.result;
            if (
              message.chat.id !== Number(chatId) ||
              message.message_thread_id !== Number(threadId)
            ) {
              res.writeHead(502).end();
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json" }).end(
              JSON.stringify({
                messageUrl: `https://t.me/c/${chatId!.slice(4)}/${threadId}/${message.message_id}`,
              }),
            );
          } catch {
            res.writeHead(502).end();
          } finally {
            sending = false;
          }
        },
      );
    },
  };
}
