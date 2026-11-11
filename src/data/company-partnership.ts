import { publicContactUrl } from "./company";

export const companyPartnership = {
  eyebrow: "Партнёрство",
  invitation: ["Вам письмо", "от Young Unicorn"],
  open: "Открыть приглашение",
  letterLabel: "Приглашение к сотрудничеству",
  title: "Вместе мы превращаем смелые идеи в бренды, которым доверяют",
  action: "Связаться с нами",
  close: "Свернуть письмо",
  contactUrl: publicContactUrl("partnership"),
  // Reference only; the invitation uses independent SVG layers.
  envelope: "media/partnership/glass-envelope-v1.png",
} as const;
