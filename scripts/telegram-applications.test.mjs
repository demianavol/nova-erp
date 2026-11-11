import { expect, it, vi } from "vitest";
import { createApplicationHandler } from "./telegram-applications.mjs";

it("delivers a reply to the career prompt before confirming it", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const handle = createApplicationHandler({ botId: 9, inbox: "-1001", send });
  const message = {
    chat: { type: "private", id: 42 },
    from: { first_name: "Ирина" },
  };
  await handle({
    update_id: 1,
    message: { ...message, text: "/start careers" },
  });
  const [, prompt, markup] = send.mock.calls[0];
  expect(markup).toEqual({ force_reply: true });
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
  );
  expect(send).toHaveBeenNthCalledWith(
    3,
    42,
    expect.stringContaining("передана команде"),
  );
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
