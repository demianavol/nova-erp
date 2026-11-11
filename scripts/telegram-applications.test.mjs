import { expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createApplicationHandler,
  openApplicationReplies,
} from "./telegram-applications.mjs";

it("delivers the application to the configured forum topic before confirming it", async () => {
  const send = vi.fn().mockResolvedValue({ message_id: 71 });
  const remember = vi.fn();
  const handle = createApplicationHandler({
    botId: 9,
    inbox: "-1001",
    threadId: 17,
    send,
    replies: { remember },
  });
  const message = {
    chat: { type: "private", id: 42 },
    from: { first_name: "Ирина" },
  };
  await handle({
    update_id: 1,
    message: { ...message, text: "/start careers" },
  });
  const [, prompt, markup] = send.mock.calls[0];
  expect(markup).toEqual({ reply_markup: { force_reply: true } });
  await handle({
    update_id: 2,
    message: {
      ...message,
      text: "Интересует вакансия",
      reply_to_message: { from: { id: 9 }, text: prompt },
    },
  });
  expect(send).toHaveBeenNthCalledWith(
    2,
    "-1001",
    expect.stringContaining("Заявка №2 · Карьера"),
    { message_thread_id: 17 },
  );
  expect(remember).toHaveBeenCalledWith("-1001", 71, 42, 2);
  expect(send).toHaveBeenNthCalledWith(
    3,
    42,
    expect.stringContaining("передана команде"),
  );
});

it("continues the correct application in both directions after a restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "yuc-replies-"));
  const path = join(directory, "test.sqlite");
  let replies;
  try {
    replies = await openApplicationReplies(path);
    replies.remember(-1001, 71, 42, 2);
    replies.remember(-1001, 73, 42, 3);
    replies.close();
    replies = undefined;
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
  const handle = createApplicationHandler({ botId: 9, inbox: "-1001", send });
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
  expect(send.mock.calls).toEqual([[42, expect.stringContaining("/start")]]);
});

it("does not confirm a submission if Telegram rejects the delivery", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const handle = createApplicationHandler({ botId: 9, inbox: "-1001", send });
  const message = {
    chat: { type: "private", id: 42 },
    from: { first_name: "Ирина" },
  };
  await handle({
    update_id: 5,
    message: { ...message, text: "/start partnership" },
  });
  const [, prompt] = send.mock.calls[0];
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    send.mockRejectedValueOnce(new Error("Telegram sendMessage: ошибка 403."));
    await handle({
      update_id: 6,
      message: {
        ...message,
        text: "Предлагаю сотрудничество",
        reply_to_message: { from: { id: 9 }, text: prompt },
      },
    });
    expect(send).toHaveBeenNthCalledWith(
      2,
      "-1001",
      expect.stringContaining("Партнёрство"),
      undefined,
    );
    expect(send).toHaveBeenNthCalledWith(
      3,
      42,
      expect.stringContaining("Не удалось подтвердить"),
    );
  } finally {
    log.mockRestore();
  }
});
