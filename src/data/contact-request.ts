import { z } from "zod";

export const contactMethods = [
  { id: "phone", label: "Телефон", placeholder: "+86 138 0013 8000" },
  { id: "email", label: "Email", placeholder: "name@company.com" },
  { id: "telegram", label: "Telegram", placeholder: "@username" },
  { id: "wechat", label: "WeChat", placeholder: "Ваш WeChat ID" },
] as const;

export const contactRequestSchema = z
  .object({
    name: z.string().trim().max(80, "Не больше 80 символов"),
    method: z.enum(["phone", "email", "telegram", "wechat"]),
    contact: z
      .string()
      .trim()
      .min(1, "Укажите контакт")
      .max(160, "Не больше 160 символов"),
  })
  .superRefine((value, ctx) => {
    const valid =
      value.method === "email"
        ? z.email().safeParse(value.contact).success
        : value.method === "phone"
          ? /^[+\d\s().-]+$/.test(value.contact) &&
            value.contact.replace(/\D/g, "").length >= 7 &&
            value.contact.replace(/\D/g, "").length <= 15
          : value.method === "telegram"
            ? /^(?:https:\/\/t\.me\/|@)?[a-zA-Z0-9_]{3,32}$/.test(value.contact)
            : /^\S{3,80}$/.test(value.contact);
    if (!valid)
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message:
          value.method === "email"
            ? "Проверьте адрес email"
            : value.method === "phone"
              ? "Введите телефон с кодом страны"
              : "Проверьте контакт в мессенджере",
      });
  });

export type ContactRequest = z.infer<typeof contactRequestSchema>;
