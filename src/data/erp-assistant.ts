import { z } from "zod";

export const assistantEndpoint = "/api/erp/assistant";
export const assistantHistoryLimit = 2;
export const assistantQuestion = z.string().trim().min(1).max(600);
const answerText = z.string().trim().max(1400);

export const assistantRequest = z.object({
  question: assistantQuestion,
  history: z
    .array(z.object({ question: assistantQuestion, answer: answerText.min(1) }))
    .max(assistantHistoryLimit),
});

export const assistantReply = z.object({
  answer: answerText.min(1),
  sources: z.array(z.object({ id: z.string(), title: z.string() })).max(3),
});

export type AssistantReply = z.infer<typeof assistantReply>;

export function assistantTaskStatus(question: string) {
  const query = question
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(
      /^(?:(?:покажи|подскажи|скажи|перечисли|проверь|посмотри|пожалуйста) )+/u,
      "",
    );

  if (
    /(?:^| )weeek(?: |$)/u.test(query) ||
    /^(?:как|где|почему|зачем|когда|что делать|что значит|что означает)(?: |$)/u.test(
      query,
    )
  )
    return null;
  if (
    /просроч/u.test(query) &&
    /^(?:просроч|что |какие |какая |какая-нибудь |сколько |есть |у меня |мои |задач)/u.test(
      query,
    )
  )
    return "overdue";
  if (
    /^(?:мои (?:открытые |активные )?задачи|задачи у меня|какие (?:у меня |мои )?задачи(?: у меня)?|что у меня (?:по задачам|в работе))(?: в erp| в работе| сейчас)?$/u.test(
      query,
    )
  )
    return "active";
  return null;
}
