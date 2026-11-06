import { z } from "zod";
import { contactRequestSchema } from "./contact-request";

const adminEmail = "avolstiinyi.demian@gmail.com";

export const erpAccessSchema = z.object({
  name: z.string().trim().min(1, "Укажите фамилию и имя").max(80),
  department: z
    .string()
    .trim()
    .min(1, "Укажите отдел или руководителя")
    .max(120),
  contact: z
    .string()
    .trim()
    .min(1, "Укажите Telegram или телефон")
    .refine(
      (contact) =>
        !contact ||
        contactRequestSchema.safeParse({
          name: "",
          method: /^[+\d\s().-]+$/.test(contact) ? "phone" : "telegram",
          contact,
        }).success,
      "Проверьте Telegram или номер телефона",
    ),
  note: z.string().trim().max(300),
});

export function erpAccessMailto(request: z.infer<typeof erpAccessSchema>) {
  const subject = encodeURIComponent("Запрос доступа в ERP Young Unicorn");
  const lines = [
    `Фамилия и имя: ${request.name}`,
    `Отдел или руководитель: ${request.department}`,
    `Telegram или телефон: ${request.contact}`,
  ];
  if (request.note) lines.push("", request.note.replace(/\r?\n/g, "\r\n"));
  const body = encodeURIComponent(lines.join("\r\n"));
  return `mailto:${adminEmail}?subject=${subject}&body=${body}`;
}
