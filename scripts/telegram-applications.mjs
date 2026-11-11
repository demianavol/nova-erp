import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const topics = {
  general: "Обращение",
  partnership: "Партнёрство",
  careers: "Карьера",
};
const maxLength = 2400;
const prompt = (topic) =>
  `${topics[topic]} · Young Unicorn\n\nОтветьте на это сообщение одним текстом. Укажите имя, как с вами связаться и кратко опишите ваш запрос. Сообщение увидит команда Young Unicorn.`;

export function createApplicationHandler({ botId, inbox, threadId, send }) {
  return async ({ update_id, message }) => {
    if (
      message?.chat?.type !== "private" ||
      !message.from ||
      message.from.is_bot
    )
      return;
    const chat = message.chat.id;
    const text = message.text?.trim();
    const [command, argument] = text?.split(/\s+/, 2) ?? [];
    if (command?.split("@", 1)[0] === "/start") {
      const topic = Object.hasOwn(topics, argument) ? argument : "general";
      await send(chat, prompt(topic), { reply_markup: { force_reply: true } });
      return;
    }

    const reply = message.reply_to_message;
    const topic =
      reply?.from?.id === botId
        ? Object.keys(topics).find((key) => reply.text === prompt(key))
        : undefined;
    if (!topic) {
      await send(
        chat,
        "Чтобы оставить заявку, отправьте /start и ответьте на сообщение бота.",
      );
      return;
    }
    if (!text || text.length > maxLength) {
      await send(
        chat,
        `Ответьте на сообщение с запросом текстом до ${maxLength} символов.`,
      );
      return;
    }

    const { first_name, last_name, username } = message.from;
    const sender = [first_name, last_name, username && `(@${username})`]
      .filter(Boolean)
      .join(" ");
    try {
      await send(
        inbox,
        `Заявка №${update_id} · ${topics[topic]}\nОт: ${sender}\n\n${text}`,
        threadId === undefined ? undefined : { message_thread_id: threadId },
      );
    } catch (error) {
      console.error(
        `Не удалось подтвердить доставку заявки №${update_id}: ${error.message}`,
      );
      await send(
        chat,
        "Не удалось подтвердить доставку. Если команда не ответит, отправьте заявку ещё раз.",
      );
      return;
    }
    await send(
      chat,
      `Заявка №${update_id} передана команде Young Unicorn. Спасибо!`,
    );
  };
}

async function main() {
  const token = process.env.TELEGRAM_APPLICATION_BOT_TOKEN?.trim();
  const inbox = Number(process.env.TELEGRAM_APPLICATION_CHAT_ID);
  const threadSetting = process.env.TELEGRAM_APPLICATION_THREAD_ID?.trim();
  const threadId = threadSetting ? Number(threadSetting) : undefined;
  const listChats = process.argv.includes("--list-chats");
  if (!/^\d+:[\w-]+$/.test(token ?? ""))
    throw new Error("Задайте TELEGRAM_APPLICATION_BOT_TOKEN.");
  if (!listChats && (!Number.isSafeInteger(inbox) || inbox >= 0))
    throw new Error("Задайте TELEGRAM_APPLICATION_CHAT_ID закрытой группы.");
  if (
    threadId !== undefined &&
    (!Number.isSafeInteger(threadId) || threadId <= 0)
  )
    throw new Error("Задайте корректный TELEGRAM_APPLICATION_THREAD_ID.");

  const controller = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => controller.abort());
  }
  async function api(method, body = {}) {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(40000),
        ]),
      },
    ).catch(() => {
      throw new Error(`Telegram ${method}: ошибка соединения.`);
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok)
      throw new Error(
        `Telegram ${method}: ошибка ${payload?.error_code ?? response.status}.`,
      );
    return payload.result;
  }

  if (listChats) {
    const updates = await api("getUpdates", { allowed_updates: ["message"] });
    const groups = new Map();
    for (const update of updates) {
      const chat = update.message?.chat;
      if (chat?.type === "group" || chat?.type === "supergroup")
        groups.set(chat.id, chat.title);
    }
    for (const [id, title] of groups) console.log(id, title);
    if (!groups.size)
      console.log(
        "Групп пока нет. Добавьте бота в группу и отправьте /start@имя_бота.",
      );
    return;
  }

  const bot = await api("getMe");
  const group = await api("getChat", { chat_id: inbox });
  if (group.type !== "group" && group.type !== "supergroup")
    throw new Error("Чат для заявок должен быть группой.");
  if (group.username || group.active_usernames?.length)
    throw new Error("Укажите закрытую группу без публичного имени.");
  if (threadId !== undefined && !group.is_forum)
    throw new Error(
      "Для доставки в тему в группе должен быть включён режим тем.",
    );
  const handle = createApplicationHandler({
    botId: bot.id,
    inbox,
    threadId,
    send: async (chat_id, text, options) => {
      const sent = await api("sendMessage", {
        chat_id,
        text,
        ...options,
        link_preview_options: { is_disabled: true },
      });
      if (chat_id === inbox)
        console.log(`Заявка доставлена. ID сообщения: ${sent.message_id}.`);
      if (options?.reply_markup?.force_reply)
        console.log("Отправлена форма заявки в личный чат.");
      return sent;
    },
  });
  console.log(`Бот @${bot.username} принимает заявки.`);

  let offset;
  while (!controller.signal.aborted) {
    let updates;
    try {
      updates = await api("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
    } catch (error) {
      if (controller.signal.aborted) break;
      if (/ошибка (401|409)\.$/.test(error.message)) throw error;
      console.error(error.message);
      await delay(3000);
      continue;
    }
    for (const update of updates) {
      if (controller.signal.aborted) break;
      try {
        await handle(update);
      } catch (error) {
        console.error(`Обновление №${update.update_id}: ${error.message}`);
      }
      offset = update.update_id + 1;
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
