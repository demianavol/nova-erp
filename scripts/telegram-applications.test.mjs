import { expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createApplicationHandler,
  openApplicationReplies,
} from "./telegram-applications.mjs";

const topicCases = [
  ["partnership", "Партнёрство", "Партнёрство", "#партнерство"],
  ["careers", "Хочу в команду", "Кандидат", "#карьера"],
  ["general", "Просто вопрос", "Общий вопрос", "#вопрос"],
];

it.each(topicCases)(
  "routes a %s application with its hashtag",
  async (topic, label, title, tag) => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ message_id: 70 })
      .mockResolvedValue({ message_id: 71 });
    const answerCallback = vi.fn().mockResolvedValue(undefined);
    const replies = await openApplicationReplies(":memory:");
    const handle = createApplicationHandler({
      botId: 9,
      inbox: -1001,
      threadId: 17,
      send,
      replies,
      answerCallback,
    });
    const message = {
      chat: { type: "private", id: 42 },
      from: { id: 42, first_name: "Ирина" },
    };
    try {
      await handle({
        update_id: 1,
        message: { ...message, text: `/start ${topic}` },
      });
      const [, menu, markup] = send.mock.calls[0];
      const buttons = markup.reply_markup.inline_keyboard.flat();
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toEqual({
        text: label,
        callback_data: `application:${topic}`,
      });
      await handle({
        update_id: 2,
        callback_query: {
          id: "choice",
          from: message.from,
          message: { chat: message.chat, from: { id: 9 }, text: menu },
          data: buttons[0].callback_data,
        },
      });
      expect(answerCallback).toHaveBeenCalledWith("choice");
      expect(send).toHaveBeenNthCalledWith(
        2,
        42,
        expect.stringContaining("Напишите запрос"),
      );
      await handle({
        update_id: 3,
        message: { ...message, text: "Тестовая заявка" },
      });
      const [inbox, submission, options] = send.mock.calls[2];
      expect(inbox).toBe(-1001);
      expect(options.message_thread_id).toBe(17);
      expect(submission).toContain(
        `Заявка №3 · ${title}\n${tag}\nОт: Ирина\n\nТестовая заявка`,
      );
      expect(options.entities).toEqual([
        {
          type: "hashtag",
          offset: submission.indexOf(tag),
          length: tag.length,
        },
      ]);
      expect(send).toHaveBeenNthCalledWith(
        4,
        42,
        expect.stringContaining("передана команде"),
      );
      expect(replies.draft(-1001, 42)).toBeUndefined();
      send.mockResolvedValue({ message_id: 72 });
      await handle({
        update_id: 4,
        message: { ...message, text: "Уточнение" },
      });
      expect(send).toHaveBeenNthCalledWith(
        5,
        -1001,
        expect.stringContaining(`Продолжение заявки №3\n${tag}`),
        expect.objectContaining({
          message_thread_id: 17,
          reply_parameters: {
            message_id: 71,
            allow_sending_without_reply: true,
          },
        }),
      );
    } finally {
      replies.close();
    }
  },
);

it("continues the correct application in both directions after a restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "yuc-replies-"));
  const path = join(directory, "test.sqlite");
  let replies;
  try {
    const oldDatabase = new DatabaseSync(path);
    oldDatabase.exec(`
      CREATE TABLE application_replies (
        inbox INTEGER NOT NULL, message INTEGER NOT NULL, applicant INTEGER NOT NULL,
        application INTEGER NOT NULL, PRIMARY KEY (inbox, message)
      );
      INSERT INTO application_replies VALUES (-1001, 71, 42, 2), (-1001, 73, 42, 3);
    `);
    oldDatabase.close();
    replies = await openApplicationReplies(path);
    const send = vi.fn().mockResolvedValue({ message_id: 72 });
    const handle = createApplicationHandler({
      botId: 9,
      inbox: -1001,
      threadId: 17,
      send,
      replies,
    });
    const message = {
      message_id: 44,
      chat: { type: "supergroup", id: -1001 },
      from: { id: 23 },
      text: "Спасибо, свяжемся завтра.",
      reply_to_message: {
        message_id: 71,
        from: { id: 9 },
        text: "Заявка №2 · Карьера",
      },
    };
    await handle({
      update_id: 7,
      message: { ...message, message_thread_id: 18 },
    });
    expect(send).not.toHaveBeenCalled();
    await handle({
      update_id: 8,
      message: { ...message, message_thread_id: 17 },
    });
    expect(send).toHaveBeenNthCalledWith(
      1,
      42,
      expect.stringContaining(message.text),
    );
    expect(send).toHaveBeenNthCalledWith(
      2,
      -1001,
      "Ответ отправлен заявителю.",
      {
        message_thread_id: 17,
        reply_parameters: { message_id: 44 },
      },
    );
    const teamReply = send.mock.calls[0][1];
    send.mockReset().mockResolvedValue({ message_id: 74 });
    const direct = {
      chat: { type: "private", id: 42 },
      from: { id: 42, first_name: "Ирина" },
      text: "Во сколько можно созвониться?",
    };
    await handle({
      update_id: 9,
      message: {
        ...direct,
        reply_to_message: { from: { id: 9 }, text: teamReply },
      },
    });
    expect(send).toHaveBeenNthCalledWith(
      1,
      -1001,
      expect.stringContaining("Продолжение заявки №2"),
      expect.objectContaining({
        message_thread_id: 17,
        reply_parameters: { message_id: 71, allow_sending_without_reply: true },
      }),
    );
    const continuation = send.mock.calls[0][1];
    expect(send).toHaveBeenNthCalledWith(
      2,
      42,
      "Сообщение по заявке №2 передано команде.",
    );
    send.mockReset().mockResolvedValue({ message_id: 75 });
    await handle({
      update_id: 10,
      message: {
        ...message,
        message_thread_id: 17,
        reply_to_message: {
          message_id: 74,
          from: { id: 9 },
          text: continuation,
        },
      },
    });
    expect(send).toHaveBeenNthCalledWith(
      1,
      42,
      expect.stringContaining("по заявке №2"),
    );
    send.mockReset().mockResolvedValue({ message_id: 76 });
    await handle({ update_id: 11, message: direct });
    expect(send).toHaveBeenNthCalledWith(
      1,
      -1001,
      expect.stringContaining("Продолжение заявки №3"),
      expect.objectContaining({
        message_thread_id: 17,
        reply_parameters: { message_id: 73, allow_sending_without_reply: true },
      }),
    );
  } finally {
    replies?.close();
    rmSync(path, { force: true });
    rmdirSync(directory);
  }
});

it("ignores group messages and refuses to accept a reply to a different sender", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const handle = createApplicationHandler({
    botId: 9,
    inbox: -1001,
    send,
    replies: { draft: () => undefined },
  });
  await handle({
    update_id: 3,
    message: { chat: { type: "supergroup", id: -1 }, from: {}, text: "/start" },
  });
  expect(send).not.toHaveBeenCalled();
  await handle({
    update_id: 4,
    message: {
      chat: { type: "private", id: 42 },
      from: {},
      text: "Личное сообщение",
      reply_to_message: { from: { id: 8 }, text: "Запрос" },
    },
  });
  expect(send).toHaveBeenCalledExactlyOnceWith(
    42,
    expect.stringContaining("С чем вы хотите обратиться"),
    expect.objectContaining({ reply_markup: expect.any(Object) }),
  );
});

it("does not confirm a submission if Telegram rejects the delivery", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const replies = await openApplicationReplies(":memory:");
  replies.saveDraft(-1001, 42, "partnership");
  const handle = createApplicationHandler({
    botId: 9,
    inbox: -1001,
    send,
    replies,
  });
  const message = {
    chat: { type: "private", id: 42 },
    from: { first_name: "Ирина" },
  };
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    send.mockRejectedValueOnce(new Error("Telegram sendMessage: ошибка 403."));
    await handle({
      update_id: 6,
      message: {
        ...message,
        text: "Предлагаю сотрудничество",
      },
    });
    expect(send).toHaveBeenNthCalledWith(
      1,
      -1001,
      expect.stringContaining("Партнёрство"),
      expect.objectContaining({ entities: expect.any(Array) }),
    );
    expect(send).toHaveBeenNthCalledWith(
      2,
      42,
      expect.stringContaining("Не удалось подтвердить"),
    );
    expect(replies.draft(-1001, 42)?.topic).toBe("partnership");
  } finally {
    replies.close();
    log.mockRestore();
  }
});

it("keeps unanswered applications in the team queue until the latest message gets a reply", async () => {
  const inbox = -10043680;
  const replies = await openApplicationReplies(":memory:");
  const send = vi.fn().mockResolvedValue({ message_id: 72 });
  const answerCallback = vi.fn().mockResolvedValue(undefined);
  const editMessage = vi.fn().mockResolvedValue(undefined);
  const editMarkup = vi.fn().mockResolvedValue(undefined);
  const handle = createApplicationHandler({
    botId: 9,
    botUsername: "ExampleBot",
    inbox,
    threadId: 17,
    send,
    replies,
    answerCallback,
    editMessage,
    editMarkup,
  });
  const group = {
    chat: { type: "supergroup", id: inbox },
    message_thread_id: 17,
  };
  const first = {
    ...group,
    message_id: 71,
    from: { id: 9 },
    text: "Заявка №2 · Кандидат",
  };
  const owner = { id: 23, first_name: "Ирина" };
  const coworker = { id: 24, first_name: "Анна" };
  const click = (data, message, from = owner) =>
    handle({
      callback_query: { id: "click", data, message, from },
    });
  const respond = (reply_to_message, from = owner) =>
    handle({
      message: {
        ...group,
        from,
        message_id: 90,
        text: "Ответ команды",
        reply_to_message,
      },
    });
  const followUp = () =>
    handle({
      message: {
        chat: { type: "private", id: 42 },
        from: { id: 42 },
        text: "Уточнение",
      },
    });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    replies.recordIncoming(inbox, 71, 42, 2, "careers", true);
    await handle({
      message: { ...group, from: owner, text: "/queue@ExampleBot" },
    });
    const [, queue, options] = send.mock.calls[0];
    expect(queue).toContain("Ждут ответа: 1");
    expect(options.entities).toEqual([
      {
        type: "text_link",
        offset: queue.indexOf("№2"),
        length: 2,
        url: "https://t.me/c/43680/17/71",
      },
    ]);
    await click("work:take", { ...first, message_thread_id: 18 });
    expect(replies.queueItem(inbox, 2).status).toBe("new");
    await click("work:take", first);
    await click("work:take", first, coworker);
    expect(replies.queueItem(inbox, 2)).toMatchObject({
      status: "working",
      owner: 23,
    });
    await click("queue:working:0", { ...first, message_id: 80, text: queue });
    expect(editMessage).toHaveBeenCalledWith(
      inbox,
      80,
      expect.stringContaining("№2 · Кандидат · Ирина"),
      expect.any(Object),
    );
    send.mockClear();
    await respond(first, coworker);
    expect(send).toHaveBeenCalledExactlyOnceWith(
      inbox,
      expect.stringContaining("Заявка в работе у Ирина"),
      expect.any(Object),
    );
    send.mockRejectedValueOnce(new Error("Telegram sendMessage: ошибка 403."));
    await respond(first);
    expect(replies.queueItem(inbox, 2).status).toBe("working");

    await followUp();
    const second = {
      ...first,
      message_id: 72,
      text: "Продолжение заявки №2\n#карьера",
    };
    expect(replies.queueItem(inbox, 2)).toMatchObject({
      status: "working",
      message: 72,
      owner: 23,
    });
    await respond(first);
    expect(replies.queueItem(inbox, 2).status).toBe("working");
    await respond(second);
    expect(replies.queueItem(inbox, 2).status).toBe("answered");
    expect(editMarkup).toHaveBeenLastCalledWith(
      inbox,
      72,
      expect.objectContaining({
        inline_keyboard: expect.arrayContaining([
          [{ text: "✅ Отвечено: Ирина", callback_data: "work:status" }],
        ]),
      }),
    );

    send.mockResolvedValue({ message_id: 73 });
    await followUp();
    await click("work:release", second);
    expect(replies.queueItem(inbox, 2)).toMatchObject({
      status: "new",
      message: 73,
      owner: null,
    });
  } finally {
    log.mockRestore();
    replies.close();
  }
});

it("opens a queue reply for the selected application and delivers it only from that operator", async () => {
  const inbox = -10043680;
  const replies = await openApplicationReplies(":memory:");
  const send = vi.fn().mockResolvedValue({ message_id: 82 });
  const answerCallback = vi.fn().mockResolvedValue(undefined);
  const handle = createApplicationHandler({
    botId: 9,
    inbox,
    threadId: 17,
    send,
    replies,
    answerCallback,
  });
  const group = {
    chat: { type: "supergroup", id: inbox },
    message_thread_id: 17,
  };
  const operator = { id: 23, first_name: "Ирина" };
  try {
    replies.recordIncoming(inbox, 71, 42, 2, "careers", true);
    replies.recordIncoming(inbox, 73, 44, 3, "general", true);
    await handle({ message: { ...group, from: operator, text: "/queue" } });
    const [, queue, options] = send.mock.calls[0];
    const [show, reply] = options.reply_markup.inline_keyboard[2];
    expect(show).toEqual({
      text: "Показать №3",
      url: "https://t.me/c/43680/17/73",
    });
    const click = () =>
      handle({
        callback_query: {
          id: "reply",
          data: reply.callback_data,
          from: operator,
          message: { ...group, from: { id: 9 }, message_id: 80, text: queue },
        },
      });
    await click();
    const [, prompt, promptOptions] = send.mock.calls[1];
    expect(promptOptions).toMatchObject({
      message_thread_id: 17,
      reply_parameters: { message_id: 73 },
      reply_markup: { force_reply: true, selective: true },
      entities: [{ type: "text_mention", user: operator }],
    });
    const respond = (from) =>
      handle({
        message: {
          ...group,
          from,
          message_id: 84,
          text: "Ответ команды",
          reply_to_message: { from: { id: 9 }, message_id: 82, text: prompt },
        },
      });
    send.mockClear();
    await respond({ id: 24, first_name: "Анна" });
    expect(send).toHaveBeenCalledExactlyOnceWith(
      inbox,
      expect.stringContaining("Откройте свой ответ"),
      expect.any(Object),
    );
    send.mockClear();
    await respond(operator);
    expect(send).toHaveBeenNthCalledWith(
      1,
      44,
      expect.stringContaining("по заявке №3"),
    );
    expect(replies.queueItem(inbox, 2).status).toBe("new");
    expect(replies.queueItem(inbox, 3).status).toBe("answered");
    send.mockClear();
    await respond(operator);
    expect(send).toHaveBeenCalledExactlyOnceWith(
      inbox,
      expect.any(String),
      expect.any(Object),
    );

    send.mockResolvedValue({ message_id: 85 });
    replies.recordIncoming(inbox, 83, 44, 3, "general", false);
    send.mockClear();
    await click();
    expect(send).not.toHaveBeenCalled();
    expect(answerCallback).toHaveBeenLastCalledWith(
      "reply",
      expect.stringContaining("Обновите очередь"),
    );
  } finally {
    replies.close();
  }
});
