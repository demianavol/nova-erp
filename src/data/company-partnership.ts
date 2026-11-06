import { company } from "./company";

export const companyPartnership = {
  eyebrow: "Партнёрство",
  invitation: ["Вам письмо", "от Young Unicorn"],
  open: "Открыть приглашение",
  letterLabel: "Приглашение к сотрудничеству",
  title: "Давайте создадим сильный бренд вместе",
  opening:
    "Вы производите или поставляете продукты? Давайте обсудим, что можем создать вместе",
  description:
    "Мы объединяем работу над продуктом, контентом, маркетингом и продажами. Ищем партнёров, с которыми можно развивать существующие направления и запускать новые",
  action: "Обсудить сотрудничество",
  close: "Свернуть письмо",
  contactUrl: company.partnerUrl,
  // Reference only; the invitation uses independent SVG layers.
  envelope: "media/partnership/glass-envelope-v1.png",
} as const;
