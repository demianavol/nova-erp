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
          reply_parameters: { message_id: 71 },
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
      { message_thread_id: 17, reply_parameters: { message_id: 71 } },
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
      { message_thread_id: 17, reply_parameters: { message_id: 73 } },
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
