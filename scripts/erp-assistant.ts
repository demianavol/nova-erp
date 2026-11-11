import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { z } from "zod";
import {
  assistantEndpoint,
  assistantRequest,
  type AssistantReply,
} from "../src/data/erp-assistant";
import { guideTopics } from "../src/data/employee-guide";
import type { erpDemoSession } from "./erp-demo-session";

const model = "qwen3:4b";
const capabilitiesQuestion =
  /^(?:а\s+)?(?:что\s+ты\s+(?:умеешь|можешь(?:\s+делать)?)|чем\s+ты\s+(?:хорош|полезен|можешь\s+помочь))[\s?!.]*$/iu;
const capabilitiesReply: AssistantReply = {
  answer:
    "Я помощник Nova ERP. Показываю ваши открытые и просроченные задачи из ERP со сроками и ссылками на карточки. Отвечаю по справочнику сотрудника. О WEEEK могу рассказать по статьям справочника.",
  sources: [],
};
const topicsById = new Map(guideTopics.map((topic) => [topic.id, topic]));
const guide = guideTopics
  .map(({ id, title, sections }) =>
    [
      `[${id}] ${title}`,
      ...sections.map(({ title, text, items }) =>
        [title, text, ...(items ?? [])].filter(Boolean).join("\n"),
      ),
    ].join("\n"),
  )
  .join("\n\n");

const answerKind = z.enum(["capabilities", "handbook"]);
const modelAnswer = z.object({
  kind: answerKind,
  answer: z.string().trim().max(1400),
  topicIds: z.array(z.string()).max(3),
});

const answerFormat = {
  type: "object",
  properties: {
    kind: { type: "string", enum: answerKind.options },
    answer: { type: "string", maxLength: 1400 },
    topicIds: {
      type: "array",
      items: { type: "string", enum: [...topicsById.keys()] },
      maxItems: 3,
    },
  },
  required: ["kind", "answer", "topicIds"],
  additionalProperties: false,
};

const instructions = `Пользователь общается с помощником внутри Nova ERP. Приложение показывает задачи из Nova ERP и использует тебя для ответов по справочнику сотрудника. WEEEK и другие внешние сервисы в справочнике описывают работу команды. Интеграций с этими сервисами у помощника нет.

Определи, о чём спрашивает пользователь, и заполни JSON с полями kind, answer и topicIds:
- kind "capabilities" для вопросов о возможностях помощника, его доступе к сервисам, просьб посмотреть или изменить данные во внешнем сервисе и уточнений о том, в какой системе работает помощник. Оставь answer и topicIds пустыми. Приложение подставит описание своих функций.
- kind "handbook" для вопросов о работе команды, правилах и назначении сервисов. Отвечай по-русски простым текстом, без Markdown, опираясь на справочник. Описывай действия команды в третьем лице. В topicIds верни до трёх идентификаторов статей, которые подтверждают ответ. Если подходящих сведений нет, оставь answer и topicIds пустыми.

Используй историю, чтобы понять, к чему относится уточнение пользователя. Проверяй факты по справочнику. Предыдущие реплики не определяют функции помощника.

СПРАВОЧНИК СОТРУДНИКА
${guide}`;

function send(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readRequest(req: IncomingMessage) {
  const limit = 16 * 1024;
  const chunks: Buffer[] = [];
  let bytes = 0;
  // Leave the connection open long enough to send the 413 response.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > limit) return null;
    chunks.push(chunk);
  }
  return assistantRequest.safeParse(
    JSON.parse(Buffer.concat(chunks).toString("utf8")),
  );
}

export function erpAssistant({
  authenticated,
  isLocalPost,
}: Pick<
  ReturnType<typeof erpDemoSession>,
  "authenticated" | "isLocalPost"
>): Plugin {
  let busy = false;

  return {
    name: "erp-assistant",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(assistantEndpoint, async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          return send(res, 405, { error: "Используйте POST." });
        }
        if (!isLocalPost(req)) {
          return send(res, 403, { error: "Откройте локальную версию ERP." });
        }
        if (!authenticated(req)) {
          return send(res, 401, {
            error: "Сессия истекла. Войдите в ERP снова.",
          });
        }

        let input;
        try {
          input = await readRequest(req);
        } catch {
          return send(res, 400, { error: "Не удалось прочитать вопрос." });
        }
        if (input === null) {
          req.resume();
          return send(res, 413, { error: "Запрос слишком длинный." });
        }
        if (!input.success) {
          return send(res, 400, { error: "Проверьте текст вопроса." });
        }
        const { question, history } = input.data;
        if (capabilitiesQuestion.test(question)) {
          return send(res, 200, capabilitiesReply);
        }
        if (busy) {
          return send(res, 429, {
            error: "Помощник отвечает на другой вопрос. Попробуйте ещё раз.",
          });
        }

        busy = true;
        const disconnect = new AbortController();
        const timeout = AbortSignal.timeout(90_000);
        res.once("close", () => disconnect.abort());

        try {
          const response = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.any([disconnect.signal, timeout]),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              stream: false,
              think: false,
              format: answerFormat,
              options: { temperature: 0.1, num_ctx: 8192, num_predict: 512 },
              messages: [
                { role: "system", content: instructions },
                ...history.flatMap(({ question, answer }) => [
                  { role: "user", content: question },
                  { role: "assistant", content: answer },
                ]),
                { role: "user", content: question },
              ],
            }),
          });
          if (response.status === 404) {
            return send(res, 503, {
              error:
                "Модель ещё не готова. После завершения загрузки отправьте вопрос снова.",
            });
          }
          if (!response.ok) {
            return send(res, 502, {
              error: "Ollama не смогла подготовить ответ. Попробуйте ещё раз.",
            });
          }

          const result = await response.json();
          const { kind, answer, topicIds } = modelAnswer.parse(
            JSON.parse(result.message.content),
          );
          if (kind === "capabilities") {
            return send(res, 200, capabilitiesReply);
          }
          const sources = [...new Set(topicIds)].flatMap((id) => {
            const topic = topicsById.get(id);
            return topic ? [{ id, title: topic.title }] : [];
          });
          const reply: AssistantReply =
            answer && sources.length
              ? { answer, sources }
              : {
                  answer: "В справочнике нет ответа на этот вопрос.",
                  sources: [],
                };
          send(res, 200, reply);
        } catch (error) {
          if (disconnect.signal.aborted) return;
          if (timeout.aborted) {
            return send(res, 504, {
              error: "Модель отвечает слишком долго. Попробуйте ещё раз.",
            });
          }
          if (error instanceof TypeError && error.message === "fetch failed") {
            return send(res, 503, {
              error: "Запустите Ollama на этом компьютере и повторите вопрос.",
            });
          }
          send(res, 502, {
            error: "Не удалось получить ответ модели. Попробуйте ещё раз.",
          });
        } finally {
          busy = false;
        }
      });
    },
  };
}
