import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const topics = {
  partnership: {
    label: "Партнёрство",
    title: "Партнёрство",
    tag: "#партнерство",
  },
  careers: { label: "Хочу в команду", title: "Кандидат", tag: "#карьера" },
  general: { label: "Просто вопрос", title: "Общий вопрос", tag: "#вопрос" },
};
const legacyTitles = {
  general: "Обращение",
  partnership: "Партнёрство",
  careers: "Карьера",
};
const topicMenuText = "С чем вы хотите обратиться к Young Unicorn?";
const maxLength = 2400;
const legacyPrompt = (topic) =>
  `${legacyTitles[topic]} · Young Unicorn\n\nОтветьте на это сообщение одним текстом. Укажите имя, как с вами связаться и кратко опишите ваш запрос. Сообщение увидит команда Young Unicorn.`;
const prompt = (topic) =>
  `${topics[topic].title} · Young Unicorn\n\nНапишите запрос одним сообщением. При желании укажите имя и удобный способ связи. Сообщение получит команда Young Unicorn.`;

export async function openApplicationReplies(path) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS application_replies (
      inbox INTEGER NOT NULL,
      message INTEGER NOT NULL,
      applicant INTEGER NOT NULL,
      application INTEGER NOT NULL,
      topic TEXT,
      PRIMARY KEY (inbox, message)
    );
    CREATE TABLE IF NOT EXISTS application_drafts (
      inbox INTEGER NOT NULL,
      applicant INTEGER NOT NULL,
      topic TEXT,
      PRIMARY KEY (inbox, applicant)
    );
  `);
  if (
    !db
      .prepare("PRAGMA table_info(application_replies)")
      .all()
      .some(({ name }) => name === "topic")
  )
    db.exec("ALTER TABLE application_replies ADD COLUMN topic TEXT");
  const find = db.prepare(
    "SELECT applicant, application FROM application_replies WHERE inbox = ? AND message = ?",
  );
  const insert = db.prepare(
    "INSERT INTO application_replies (inbox, message, applicant, application, topic) VALUES (?, ?, ?, ?, ?)",
  );
  const original = db.prepare(
    "SELECT message, application, topic FROM application_replies WHERE inbox = ? AND applicant = ? AND application = ? ORDER BY rowid LIMIT 1",
  );
  const latest = db.prepare(`
    SELECT message, application, topic FROM application_replies WHERE rowid = (
      SELECT MIN(rowid) FROM application_replies WHERE inbox = ? AND applicant = ?
      GROUP BY application ORDER BY MIN(rowid) DESC LIMIT 1
    )
  `);
  const draft = db.prepare(
    "SELECT topic FROM application_drafts WHERE inbox = ? AND applicant = ?",
  );
  const saveDraft = db.prepare(`
    INSERT INTO application_drafts (inbox, applicant, topic) VALUES (?, ?, ?)
    ON CONFLICT (inbox, applicant) DO UPDATE SET topic = excluded.topic
  `);
  const clearDraft = db.prepare(
    "DELETE FROM application_drafts WHERE inbox = ? AND applicant = ?",
  );
  return {
    find: (inbox, message) => find.get(inbox, message),
    conversation: (inbox, applicant, application) =>
      application === undefined
        ? latest.get(inbox, applicant)
        : original.get(inbox, applicant, application),
    remember: (inbox, message, applicant, application, topic = null) =>
      insert.run(inbox, message, applicant, application, topic),
    draft: (inbox, applicant) => draft.get(inbox, applicant),
    saveDraft: (inbox, applicant, topic) =>
      saveDraft.run(inbox, applicant, topic),
    clearDraft: (inbox, applicant) => clearDraft.run(inbox, applicant),
    close: () => db.close(),
  };
}

export function createApplicationHandler({
  botId,
  inbox,
  threadId,
  send,
  replies,
  answerCallback,
}) {
  const inboxOptions =
    threadId === undefined ? undefined : { message_thread_id: threadId };

  async function replyToApplicant(message, text) {
    if (
      message.chat.id !== inbox ||
      (threadId !== undefined && message.message_thread_id !== threadId)
    )
      return;
    const original = message.reply_to_message;
    if (
      original?.from?.id !== botId ||
      !/^(?:Заявка №\d+ · |Продолжение заявки №\d+\n)/.test(original.text ?? "")
    )
      return;
    const applicant = replies.find(inbox, original.message_id);
    const report = (status) =>
      send(inbox, status, {
        ...inboxOptions,
        reply_parameters: { message_id: message.message_id },
      });
    if (!applicant) {
      await report(
        "Для этой заявки ещё нет привязки к личному чату. Используйте контакт из заявки.",
      );
      return;
    }
    if (!text || text.length > maxLength) {
      await report(`Ответьте текстом до ${maxLength} символов.`);
      return;
    }
    try {
      await send(
        applicant.applicant,
        `Ответ команды Young Unicorn по заявке №${applicant.application}\n\n${text}`,
      );
    } catch (error) {
      console.error(
        `Не удалось доставить ответ по заявке №${applicant.application}: ${error.message}`,
      );
      await report(
        "Telegram не подтвердил доставку ответа. При необходимости повторите его или используйте контакт из заявки.",
      );
      return;
    }
    console.log(
      `Ответ по заявке №${applicant.application} доставлен в личный чат.`,
    );
    await report("Ответ отправлен заявителю.");
  }

  function showTopics(chat, suggested) {
    const keys = Object.keys(topics);
    const ordered = Object.hasOwn(topics, suggested)
      ? [suggested, ...keys.filter((topic) => topic !== suggested)]
      : keys;
    return send(chat, topicMenuText, {
      reply_markup: {
        inline_keyboard: ordered.map((topic) => [
          { text: topics[topic].label, callback_data: `application:${topic}` },
        ]),
      },
    });
  }

  return async ({ update_id, message, callback_query: callback }) => {
    if (callback) {
      await answerCallback(callback.id).catch((error) =>
        console.error(error.message),
      );
      const chat = callback.message?.chat;
      const topic = /^application:([a-z]+)$/.exec(callback.data ?? "")?.[1];
      if (
        chat?.type !== "private" ||
        chat.id !== callback.from?.id ||
        callback.message.from?.id !== botId ||
        callback.message.text !== topicMenuText ||
        !Object.hasOwn(topics, topic)
      )
        return;
      replies.saveDraft(inbox, chat.id, topic);
      await send(chat.id, prompt(topic));
      return;
    }
    if (!message?.from || message.from.is_bot) return;
    const text = message.text?.trim();
    if (message.chat.type !== "private") {
      await replyToApplicant(message, text);
      return;
    }
    const chat = message.chat.id;
    const [command, argument] = text?.split(/\s+/, 2) ?? [];
    if (command?.split("@", 1)[0] === "/start") {
      replies.saveDraft(inbox, chat, null);
      await showTopics(chat, argument);
      return;
    }

    const reply = message.reply_to_message;
    const draft = replies.draft(inbox, chat);
    const legacyTopic =
      reply?.from?.id === botId
        ? Object.keys(topics).find((key) => reply.text === legacyPrompt(key))
        : undefined;
    const topic =
      legacyTopic ??
      (draft?.topic &&
      (!reply ||
        (reply.from?.id === botId && reply.text === prompt(draft.topic)))
        ? draft.topic
        : undefined);
    const referenced =
      reply?.from?.id === botId
        ? /^(?:(?:Ответ команды Young Unicorn|Сообщение) по заявке №(\d+)(?:\n| передано команде)|Заявка №(\d+) передана команде)/.exec(
            reply.text ?? "",
          )
        : null;
    const conversation =
      !topic && ((!reply && !draft) || referenced)
        ? replies.conversation(
            inbox,
            chat,
            referenced ? Number(referenced[1] ?? referenced[2]) : undefined,
          )
        : undefined;
    if (!topic && !conversation) {
      await showTopics(chat);
      return;
    }
    if (!text || text.length > maxLength) {
      await send(chat, `Отправьте сообщение текстом до ${maxLength} символов.`);
      return;
    }

    const application = conversation?.application ?? update_id;
    const { first_name, last_name, username } = message.from;
    const sender = [first_name, last_name, username && `(@${username})`]
      .filter(Boolean)
      .join(" ");
    const title = conversation
      ? `Продолжение заявки №${application}`
      : `Заявка №${application} · ${topics[topic].title}`;
    const category = conversation ? conversation.topic : topic;
    const tag = topics[category]?.tag;
    const options = conversation
      ? {
          ...inboxOptions,
          reply_parameters: { message_id: conversation.message },
        }
      : inboxOptions;
    try {
      const sent = await send(
        inbox,
        `${title}${tag ? `\n${tag}` : ""}\nОт: ${sender}\n\n${text}`,
        tag
          ? {
              ...options,
              entities: [
                {
                  type: "hashtag",
                  offset: title.length + 1,
                  length: tag.length,
                },
              ],
            }
          : options,
      );
      replies.remember(inbox, sent.message_id, chat, application, category);
      if (!conversation) replies.clearDraft(inbox, chat);
      if (conversation)
        console.log(
          `Продолжение заявки №${application} доставлено. ID сообщения: ${sent.message_id}.`,
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
      conversation
        ? `Сообщение по заявке №${application} передано команде.`
        : `Заявка №${application} передана команде Young Unicorn. Спасибо!`,
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
  const replies = await openApplicationReplies(
    fileURLToPath(new URL("./telegram-applications.sqlite", import.meta.url)),
  );
  const handle = createApplicationHandler({
    botId: bot.id,
    inbox,
    threadId,
    replies,
    answerCallback: (id) =>
      api("answerCallbackQuery", { callback_query_id: id }),
    send: async (chat_id, text, options) => {
      const sent = await api("sendMessage", {
        chat_id,
        text,
        ...options,
        link_preview_options: { is_disabled: true },
      });
      if (chat_id === inbox && !options?.reply_parameters)
        console.log(`Заявка доставлена. ID сообщения: ${sent.message_id}.`);
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
        allowed_updates: ["message", "callback_query"],
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
