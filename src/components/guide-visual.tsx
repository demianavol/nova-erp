import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Compass,
  FlaskConical,
  Gift,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Package,
  Palette,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  Layers3,
  type LucideIcon,
} from "lucide-react";

const topicIcons: Record<string, LucideIcon> = {
  company: Building2,
  model: RefreshCw,
  process: ClipboardList,
  hypotheses: FlaskConical,
  communication: MessagesSquare,
  services: Layers3,
  adaptation: Compass,
  rules: MessageCircle,
  calls: Video,
  motivation: TrendingUp,
};
export function GuideTopicIcon({
  id,
  size = 22,
}: {
  id: string;
  size?: number;
}) {
  const Icon = topicIcons[id] || Compass;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

type Step = { title: string; note: string; icon: LucideIcon; letter?: string };
const flows: Record<string, { caption: string; badge: string; steps: Step[] }> =
  {
    process: {
      caption: "Один спринт",
      badge: "2–4 недели",
      steps: [
        {
          title: "Планируем",
          note: "Выбираем приоритеты, декомпозируем задачи, фиксируем сроки и ответственность в WEEEK",
          icon: ClipboardList,
        },
        {
          title: "Делаем",
          note: "Выполняем задачи\nНа ежедневном Daily синхронизируемся и убираем блокеры",
          icon: Users,
        },
        {
          title: "Проверяем",
          note: "На ревью показываем конкретное, измеримое улучшение продукта и собираем обратную связь",
          icon: Check,
        },
        {
          title: "Улучшаем",
          note: "На ретроспективе анализируем цикл и выбираем улучшения для следующего спринта",
          icon: RefreshCw,
        },
      ],
    },
    hypotheses: {
      caption: "Цикл HADI",
      badge: "Каждый тест даёт новые данные",
      steps: [
        {
          title: "Гипотеза",
          letter: "H",
          note: "Если сделаем X, то получим Y\nФормулируем измеримое предположение",
          icon: Lightbulb,
        },
        {
          title: "Действие",
          letter: "A",
          note: "Запускаем быстрый и недорогой тест",
          icon: Play,
        },
        {
          title: "Данные",
          letter: "D",
          note: "Собираем метрики и факты: что изменилось после теста",
          icon: ChartNoAxesCombined,
        },
        {
          title: "Выводы",
          letter: "I",
          note: "Решаем, подтвердилась ли гипотеза, и определяем следующий шаг",
          icon: Search,
        },
      ],
    },
  };

function Flow({ id }: { id: string }) {
  const [selected, setSelected] = useState(0);
  const flow = flows[id];
  return (
    <>
      <figcaption>
        <strong>{flow.caption}</strong>
        <span>{flow.badge}</span>
      </figcaption>
      <div className={`eg-flow eg-flow-${flow.steps.length}`}>
        {flow.steps.map((step, index) => (
          <div className="eg-flow-cell" key={step.title}>
            <button
              type="button"
              className={index === selected ? "is-selected" : ""}
              aria-pressed={index === selected}
              aria-controls={`guide-flow-${id}`}
              onClick={() => setSelected(index)}
            >
              <span className="eg-flow-node">
                {step.letter || <step.icon size={26} strokeWidth={1.5} />}
              </span>
              <span>{step.title}</span>
            </button>
            {index < flow.steps.length - 1 && (
              <ArrowRight
                className="eg-flow-arrow"
                size={18}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <div id={`guide-flow-${id}`} className="eg-flow-note" aria-live="polite">
        <span>{String(selected + 1).padStart(2, "0")}</span>
        <p key={selected}>{flow.steps[selected].note}</p>
      </div>
      <div className="eg-flow-return">
        <RefreshCw size={13} /> Следующий цикл — с учётом выводов
      </div>
    </>
  );
}

const channelItems = [
  {
    icon: ClipboardList,
    tool: "WEEEK",
    label: "Задачи и договорённости",
    note: "Постановка, сроки, ответственные и обсуждения по задаче",
  },
  {
    icon: Send,
    tool: "Telegram",
    label: "Оперативные вопросы",
    note: "Командные чаты и быстрый отклик",
  },
  {
    icon: Video,
    tool: "Контур.Толк",
    label: "Звонки и встречи",
    note: "Созвоны, интервью и 1:1",
  },
  {
    icon: CalendarDays,
    tool: "Google Календарь",
    label: "Планирование встреч",
    note: "Общая «Сетка совещаний»",
  },
];

export function GuideVisual({ id }: { id: string }) {
  return (
    <figure
      className={`eg-visual eg-visual-${id}`}
      aria-label={`Наглядная схема: ${id === "adaptation" ? "период адаптации" : id === "motivation" ? "карьера и стаж" : "рабочий процесс"}`}
    >
      {id === "company" ? (
        <>
          <figcaption>
            <strong>Как растёт продукт</strong>
          </figcaption>
          <ol className="eg-company-journey">
            <li>
              <Package size={24} aria-hidden="true" />
              <strong>Создаём</strong>
              <span>Продукт и контент</span>
            </li>
            <li>
              <MessagesSquare size={24} aria-hidden="true" />
              <strong>Проверяем</strong>
              <span>Спрос и обратную связь</span>
            </li>
            <li>
              <TrendingUp size={24} aria-hidden="true" />
              <strong>Развиваем</strong>
              <span>Подтверждённые идеи</span>
            </li>
          </ol>
        </>
      ) : flows[id] ? (
        <Flow id={id} />
      ) : id === "model" ? (
        <>
          <figcaption>
            <strong>Люди → продукт → улучшения</strong>
            <span>Agile / Scrum</span>
          </figcaption>
          <div className="eg-agile-map">
            <div className="eg-agile-core">
              <RefreshCw size={33} strokeWidth={1.3} />
              <strong>Спринт</strong>
              <span>2–4 недели</span>
            </div>
            <div className="eg-agile-principle">
              <Users size={24} />
              <strong>Люди</strong>
              <span>Взаимоотношения и общая ответственность</span>
            </div>
            <div className="eg-agile-principle">
              <Package size={24} />
              <strong>Продукт</strong>
              <span>Конкретный результат каждого цикла</span>
            </div>
            <div className="eg-agile-principle">
              <RefreshCw size={24} />
              <strong>Изменения</strong>
              <span>Обратная связь и готовность менять план</span>
            </div>
          </div>
          <div className="eg-responsibility">
            <span>
              <Target size={18} />
              <span>
                Владелец продукта<small>Приоритеты и бизнес-цели</small>
              </span>
            </span>
            <ArrowRight size={18} />
            <span>
              <Users size={18} />
              <span>
                Команда<small>Оценка и организация работы</small>
              </span>
            </span>
          </div>
        </>
      ) : id === "communication" ? (
        <>
          <figcaption>
            <strong>Какой вопрос — какой канал</strong>
            <span>Одна понятная карта</span>
          </figcaption>
          <div className="eg-channel-map">
            {channelItems.map((item) => (
              <div key={item.tool}>
                <item.icon size={25} strokeWidth={1.4} />
                <span>
                  <small>{item.label}</small>
                  <strong>{item.tool}</strong>
                  <p>{item.note}</p>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : id === "services" ? (
        <>
          <figcaption>
            <strong>Инструменты по задачам</strong>
            <span>Рабочая среда команды</span>
          </figcaption>
          <div className="eg-tool-map">
            {[
              {
                title: "Организовать",
                icon: ClipboardList,
                tools: ["WEEEK"],
                note: "Задачи и знания",
              },
              {
                title: "Создать",
                icon: Palette,
                tools: ["Figma", "Miro"],
                note: "Дизайн и совместная работа",
              },
              {
                title: "Найти идею",
                icon: Sparkles,
                tools: ["ChatGPT", "Nano Banana"],
                note: "Тексты и изображения",
              },
              {
                title: "Проверить",
                icon: ChartNoAxesCombined,
                tools: ["Wildbox", "MPStats"],
                note: "Аналитика маркетплейсов",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon size={26} strokeWidth={1.4} />
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <div>
                  {item.tools.map((tool) => (
                    <span key={tool}>{tool}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="eg-visual-foot">
            <ShieldCheck size={15} /> За доступами и рабочими ссылками — к HR
          </div>
        </>
      ) : id === "adaptation" ? (
        <>
          <figcaption>
            <strong>Твой старт в команде</strong>
            <span>Период адаптации</span>
          </figcaption>
          <div className="eg-adaptation-map">
            <div className="eg-adaptation-duration">
              <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r="78" />
                <circle
                  className="eg-duration-ring"
                  pathLength="1"
                  cx="90"
                  cy="90"
                  r="78"
                />
              </svg>
              <strong>
                3<span>месяца</span>
              </strong>
            </div>
            <div className="eg-adaptation-focus">
              {[
                [Users, "Вовлечённость"],
                [Lightbulb, "Инициативность"],
                [Target, "Результаты"],
              ].map(([Icon, title]) => {
                const ItemIcon = Icon as LucideIcon;
                return (
                  <span key={String(title)}>
                    <ItemIcon size={21} />
                    {String(title)}
                  </span>
                );
              })}
            </div>
            <div className="eg-welcome-box">
              <Gift size={36} strokeWidth={1.2} />
              <strong>Welcome Box</strong>
              <span>
                По окончании
                <br />
                испытательного срока
              </span>
            </div>
          </div>
        </>
      ) : id === "rules" ? (
        <>
          <figcaption>
            <strong>Понятный запрос → быстрый отклик</strong>
            <span>Коммуникация в команде</span>
          </figcaption>
          <div className="eg-rules-map">
            <div className="eg-reply-time">
              <Clock3 size={28} strokeWidth={1.3} />
              <strong>
                5 <span>минут</span>
              </strong>
              <p>10 минут при загруженности</p>
            </div>
            <div className="eg-message-exchange">
              <div>
                <Send size={17} />
                <span>Контекст + вопрос + адресат</span>
              </div>
              <ArrowRight size={20} />
              <div>
                <Check size={17} />
                <span>Реакция + ответ</span>
              </div>
            </div>
          </div>
          <div className="eg-value-tags">
            <span>Уважение</span>
            <span>Открытость</span>
            <span>Инициатива</span>
            <span>Поиск решения</span>
          </div>
        </>
      ) : id === "calls" ? (
        <>
          <figcaption>
            <strong>Один звонок — понятные договорённости</strong>
            <span>Общаемся на «ты»</span>
          </figcaption>
          <div className="eg-call-journey">
            {[
              {
                icon: ShieldCheck,
                title: "До звонка",
                text: "Тихое место и фирменный фон",
              },
              {
                icon: Video,
                title: "Во время",
                text: "Контур.Толк · открытость и уважение",
              },
              {
                icon: ClipboardList,
                title: "После",
                text: "Саммари и задачи в WEEEK",
              },
            ].map((item, index) => (
              <div key={item.title}>
                <span className="eg-call-icon">
                  <item.icon size={27} strokeWidth={1.4} />
                </span>
                <small>0{index + 1}</small>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                {index < 2 && (
                  <ArrowRight className="eg-call-arrow" size={20} />
                )}
              </div>
            ))}
          </div>
        </>
      ) : id === "motivation" ? (
        <>
          <figcaption>
            <strong>Две шкалы развития</strong>
            <span>Карьера и опыт в компании</span>
          </figcaption>
          <div className="eg-career-ladder">
            {["Специалист", "Ведущий специалист", "Руководитель отдела"].map(
              (title, index) => (
                <div
                  key={title}
                  style={{ "--career-step": index } as CSSProperties}
                >
                  <TrendingUp size={21} />
                  <span>{title}</span>
                </div>
              ),
            )}
          </div>
          <div className="eg-tenure">
            <span>Стаж в компании</span>
            <div>
              <strong>1 год</strong>
              <span>Путь к успеху</span>
            </div>
            <div>
              <strong>3 года</strong>
              <span>Свой</span>
            </div>
            <div>
              <strong>5 лет</strong>
              <span>Мастер в деле</span>
            </div>
          </div>
        </>
      ) : null}
    </figure>
  );
}

export const guideCardNotes: Record<string, string> = {
  company: "Продукт → отклик → рост",
  model: "Люди · продукт · изменения",
  process: "План → работа → ревью → выводы",
  hypotheses: "H → A → D → I",
  communication: "Задачи · чаты · звонки · встречи",
  services: "Создаём · организуем · анализируем",
  adaptation: "3 месяца · команда · результат",
  rules: "Запрос → реакция → ответ",
  calls: "Подготовка → звонок → саммари",
  motivation: "Специалист → ведущий → руководитель",
};
