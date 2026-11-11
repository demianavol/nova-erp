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
const queueTitle = "Очередь заявок";
const queueLabels = {
  new: "Новые",
  working: "В работе",
  answered: "Отвеченные",
};
const queuePageSize = 8;
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
    CREATE TABLE IF NOT EXISTS application_queue (
      inbox INTEGER NOT NULL,
      application INTEGER NOT NULL,
      message INTEGER NOT NULL,
      topic TEXT,
      status TEXT NOT NULL CHECK (status IN ('new', 'working', 'answered')),
      owner INTEGER,
      owner_name TEXT,
      PRIMARY KEY (inbox, application)
    );
    CREATE INDEX IF NOT EXISTS application_queue_by_status
      ON application_queue (inbox, status, message);
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
  const enqueue = db.prepare(`
    INSERT INTO application_queue (inbox, application, message, topic, status)
    VALUES (?, ?, ?, ?, 'new')
    ON CONFLICT (inbox, application) DO UPDATE SET message = excluded.message,
      status = CASE WHEN status = 'working' THEN status ELSE 'new' END,
      owner = CASE WHEN status = 'working' THEN owner END,
      owner_name = CASE WHEN status = 'working' THEN owner_name END
  `);
  const queueItem = db.prepare(
    "SELECT * FROM application_queue WHERE inbox = ? AND application = ?",
  );
  const setStatus = db.prepare(`
    UPDATE application_queue SET status = ?, owner = ?, owner_name = ?
    WHERE inbox = ? AND application = ?
  `);
  const queueCounts = db.prepare(`
    SELECT status, COUNT(*) AS count FROM application_queue WHERE inbox = ? GROUP BY status
  `);
  const queuePage = db.prepare(`
    SELECT application, message, topic, owner_name FROM application_queue
    WHERE inbox = ? AND status = ?
    ORDER BY CASE WHEN status = 'answered' THEN -message ELSE message END
    LIMIT ? OFFSET ?
  `);
  return {
    find: (inbox, message) => find.get(inbox, message),
    conversation: (inbox, applicant, application) =>
      application === undefined
        ? latest.get(inbox, applicant)
        : original.get(inbox, applicant, application),
    recordIncoming(inbox, message, applicant, application, topic, isNew) {
      db.exec("BEGIN");
      try {
        insert.run(inbox, message, applicant, application, topic);
        enqueue.run(inbox, application, message, topic);
        if (isNew) clearDraft.run(inbox, applicant);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    queueItem: (inbox, application) => queueItem.get(inbox, application),
    setStatus: (inbox, application, status, owner = null, name = null) =>
      setStatus.run(status, owner, name, inbox, application),
    queueCounts: (inbox) => queueCounts.all(inbox),
    queuePage: (inbox, status, page) =>
      queuePage.all(inbox, status, queuePageSize, page * queuePageSize),
    draft: (inbox, applicant) => draft.get(inbox, applicant),
    saveDraft: (inbox, applicant, topic) =>
      saveDraft.run(inbox, applicant, topic),
    close: () => db.close(),
  };
}

export function createApplicationHandler({
  botId,
  botUsername,
  inbox,
  threadId,
  send,
  replies,
  answerCallback,
  editMessage,
  editMarkup,
}) {
  const inboxOptions =
    threadId === undefined ? undefined : { message_thread_id: threadId };

  const inInbox = (message) =>
    message?.chat.id === inbox &&
    (threadId === undefined || message.message_thread_id === threadId);
  const teamName = (user) =>
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 30) ||
    user.username ||
    "Коллега";
  const button = (text, callback_data) => ({ text, callback_data });
  const cardMarkup = (status, ownerName) => ({
    inline_keyboard: [
      [
        status === "new"
          ? button("🟡 Взять в работу", "work:take")
          : button(
              status === "working"
                ? `🟠 В работе: ${ownerName}`
                : `✅ Отвечено: ${ownerName}`,
              "work:status",
            ),
      ],
      ...(status !== "new"
        ? [
            [
              button(
                status === "working" ? "Вернуть в новые" : "Открыть снова",
                status === "working" ? "work:release" : "work:reopen",
              ),
            ],
          ]
        : []),
    ],
  });

  async function updateCard(message, markup) {
    if (!editMarkup) return;
    try {
      await editMarkup(inbox, message, markup);
    } catch (error) {
      console.error(`Не удалось обновить карточку: ${error.message}`);
    }
  }

  function queueView(status, requestedPage) {
    const counts = Object.fromEntries(
      replies.queueCounts(inbox).map(({ status, count }) => [status, count]),
    );
    const pages = Math.max(1, Math.ceil((counts[status] ?? 0) / queuePageSize));
    const page = Math.min(requestedPage, pages - 1);
    const items = replies.queuePage(inbox, status, page);
    const total = (counts.new ?? 0) + (counts.working ?? 0);
    let text = `${queueTitle}\nЖдут ответа: ${total}\n\n${queueLabels[status]} · ${page + 1}/${pages}`;
    const entities = [];
    const groupId = /^-100(\d+)$/.exec(String(inbox))?.[1];
    for (const item of items) {
      const title = `№${item.application}`;
      if (groupId) {
        const path = [groupId, threadId, item.message]
          .filter((id) => id !== undefined)
          .join("/");
        entities.push({
          type: "text_link",
          offset: text.length + 1,
          length: title.length,
          url: `https://t.me/c/${path}`,
        });
      }
      text += `\n${title} · ${topics[item.topic]?.title ?? "Обращение"}`;
      if (item.owner_name) text += ` · ${item.owner_name}`;
    }
    if (!items.length) text += "\nЗаявок нет.";
    const tabs = Object.entries(queueLabels).map(([key, label]) =>
      button(
        `${key === status ? "• " : ""}${label} ${counts[key] ?? 0}`,
        `queue:${key}:0`,
      ),
    );
    const navigation = [];
    if (page > 0)
      navigation.push(button("← Предыдущие", `queue:${status}:${page - 1}`));
    if (page + 1 < pages)
      navigation.push(button("Следующие →", `queue:${status}:${page + 1}`));
    const reply_markup = {
      inline_keyboard: [tabs, ...(navigation.length ? [navigation] : [])],
    };
    return { text, entities, reply_markup };
  }

  async function handleInboxCallback(callback, acknowledge) {
    const message = callback.message;
    const queue = /^queue:(new|working|answered):(\d{1,9})$/.exec(
      callback.data ?? "",
    );
    if (queue && message.text?.startsWith(`${queueTitle}\n`)) {
      const { text, ...options } = queueView(queue[1], Number(queue[2]));
      await acknowledge("Очередь обновлена");
      if (
        text !== message.text ||
        JSON.stringify(options.reply_markup) !==
          JSON.stringify(message.reply_markup)
      ) {
        await editMessage(inbox, message.message_id, text, options);
      }
      return;
    }
    const action = /^work:(take|release|reopen|status)$/.exec(
      callback.data ?? "",
    )?.[1];
    const application =
      action && replies.find(inbox, message.message_id)?.application;
    const item = application && replies.queueItem(inbox, application);
    if (!item || item.message !== message.message_id) {
      await acknowledge("Откройте последнее сообщение заявки через /queue.");
      return;
    }
    if (action === "take" && item.status === "new") {
      const name = teamName(callback.from);
      replies.setStatus(inbox, application, "working", callback.from.id, name);
      await acknowledge("Заявка у вас в работе.");
      await updateCard(item.message, cardMarkup("working", name));
      return;
    }
    if (
      (action === "release" && item.status === "working") ||
      (action === "reopen" && item.status === "answered")
    ) {
      replies.setStatus(inbox, application, "new");
      await acknowledge("Заявка возвращена в новые.");
      await updateCard(item.message, cardMarkup("new"));
      return;
    }
    await acknowledge(
      `${queueLabels[item.status]}${item.owner_name ? `: ${item.owner_name}` : ""}`,
    );
  }

  async function replyToApplicant(message, text) {
    if (!inInbox(message)) return;
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
    const item = replies.queueItem(inbox, applicant.application);
    if (item?.status === "working" && item.owner !== message.from.id) {
      await report(
        `Заявка в работе у ${item.owner_name}. Верните её в новые, если нужно передать ответ другому сотруднику.`,
      );
      return;
    }
    if (item?.status === "answered" && item.owner !== message.from.id) {
      await report(
        `На заявку уже ответил сотрудник ${item.owner_name}. Нажмите «Открыть снова», если нужен ещё один ответ.`,
      );
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
    if (item?.message === original.message_id && item.status !== "answered") {
      const name = teamName(message.from);
      replies.setStatus(
        inbox,
        applicant.application,
        "answered",
        message.from.id,
        name,
      );
      await updateCard(item.message, cardMarkup("answered", name));
    } else if (
      item &&
      item.message !== original.message_id &&
      item.status !== "answered"
    ) {
      await report(
        "Ответ отправлен. В очереди остаётся более новое сообщение заявителя.",
      );
      return;
    }
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
      const acknowledge = (text) =>
        (text
          ? answerCallback(callback.id, text)
          : answerCallback(callback.id)
        ).catch((error) => console.error(error.message));
      if (
        inInbox(callback.message) &&
        callback.message.from?.id === botId &&
        !callback.from?.is_bot &&
        callback.from?.id
      ) {
        await handleInboxCallback(callback, acknowledge);
        return;
      }
      await acknowledge();
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
      const command = text?.split(/\s+/, 1)[0].toLowerCase();
      if (
        inInbox(message) &&
        (command === "/queue" ||
          (botUsername && command === `/queue@${botUsername.toLowerCase()}`))
      ) {
        const { text, ...options } = queueView("new", 0);
        await send(inbox, text, { ...inboxOptions, ...options });
        return;
      }
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
    const previous = conversation && replies.queueItem(inbox, application);
    const markup = cardMarkup(
      previous?.status === "working" ? "working" : "new",
      previous?.owner_name,
    );
    const options = conversation
      ? {
          ...inboxOptions,
          reply_parameters: {
            message_id: conversation.message,
            allow_sending_without_reply: true,
          },
        }
      : inboxOptions;
    try {
      const sent = await send(
        inbox,
        `${title}${tag ? `\n${tag}` : ""}\nОт: ${sender}\n\n${text}`,
        tag
          ? {
              ...options,
              reply_markup: markup,
              entities: [
                {
                  type: "hashtag",
                  offset: title.length + 1,
                  length: tag.length,
                },
              ],
            }
          : { ...options, reply_markup: markup },
      );
      replies.recordIncoming(
        inbox,
        sent.message_id,
        chat,
        application,
        category,
        !conversation,
      );
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
    if (previous) await updateCard(previous.message, { inline_keyboard: [] });
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
    botUsername: bot.username,
    inbox,
    threadId,
    replies,
    answerCallback: (id, text) =>
      api("answerCallbackQuery", { callback_query_id: id, text }),
    editMarkup: (chat_id, message_id, reply_markup) =>
      api("editMessageReplyMarkup", { chat_id, message_id, reply_markup }),
    editMessage: (chat_id, message_id, text, options) =>
      api("editMessageText", {
        chat_id,
        message_id,
        text,
        ...options,
        link_preview_options: { is_disabled: true },
      }),
    send: async (chat_id, text, options) => {
      const sent = await api("sendMessage", {
        chat_id,
        text,
        ...options,
        link_preview_options: { is_disabled: true },
      });
      if (chat_id === inbox && text.startsWith("Заявка №"))
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
