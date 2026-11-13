import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CheckCheck,
  ClipboardList,
  Clock3,
  Gem,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useERP, usePreferences } from "../data/store";
import { useAccessBoard, useDepartmentAction } from "../data/access-board";
import { departments, departmentNames } from "../data/schema";
import { isRevenue, orderTotal } from "../data/selectors";
import { cn, money, today } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Input,
  PageHeading,
  SearchInput,
  SectionHeading,
  Select,
} from "../components/ui";
import { projectTasks, sprintRange, useWorkspace } from "../data/workspace";
import { HomeDealBoard } from "../components/home-deal-board";
import { ProjectNavigation } from "../components/project-navigation";
import { AvatarPicker } from "../components/avatar-picker";
import { HoldButton, SaveButton, useSaveAction } from "../components/ui/action-buttons";
import { TaskRow } from "./dashboard";
import {
  defaultTaskFilters,
  filterTasks,
  type TaskStatus,
  type TaskSort,
} from "../data/tasks";

export function Tasks() {
  const { data } = useERP(),
    navigate = useNavigate();
  const [filters, setFilters] = useState(defaultTaskFilters);
  const { search, status, department, employee, sort } = filters;
  const [params] = useSearchParams();
  const projects = useWorkspace((s) => s.projects);
  const project = projects.find((p) => p.id === params.get("project"));
  const view = params.get("view") || "";
  const scopeTasks = projectTasks(data.tasks, project, view);
  const list = filterTasks({ ...data, tasks: scopeTasks }, filters, today());
  const taskQuery = project ? "&project=" + encodeURIComponent(project.id) : "";
  const updateFilter = (next: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...next }));
  const resetFilters = () => setFilters(defaultTaskFilters);
  const filtered = Object.keys(defaultTaskFilters).some(
    (key) =>
      filters[key as keyof typeof filters] !==
      defaultTaskFilters[key as keyof typeof filters],
  );
  return (
    <>
      <PageHeading
        eyebrow="РАБОЧЕЕ ПРОСТРАНСТВО"
        title={
          view === "sprint"
            ? "Спринт недели"
            : view === "backlog"
              ? "Бэклог"
              : "Задачи команды"
        }
        description={
          view === "sprint"
            ? `${project?.name || "Вся команда"} · ${sprintRange().from} — ${sprintRange().to}`
            : project?.name ||
              "Ясные приоритеты. Общий фокус. Видимый результат."
        }
        actions={
          <>
            <Link className="btn btn-outline" to="/erp/tasks/projects">
              Проекты
            </Link>
            <Button onClick={() => navigate("/erp/tasks?create=1" + taskQuery)}>
              <Plus size={17} />
              Создать задачу
            </Button>
          </>
        }
      />
      <div className="task-stats">
        <div>
          <ClipboardList size={19} />
          <strong>{scopeTasks.filter((t) => !t.done).length}</strong>
          <span>в работе</span>
        </div>
        <div>
          <Clock3 size={19} />
          <strong>
            {scopeTasks.filter((t) => !t.done && t.dueAt < today()).length}
          </strong>
          <span>просрочено</span>
        </div>
        <div>
          <CheckCheck size={19} />
          <strong>{scopeTasks.filter((t) => t.done).length}</strong>
          <span>завершено</span>
        </div>
      </div>
      <section className="card list-card">
        <div className="list-tabs">
          {[
            ["active", "В работе"],
            ["overdue", "Просрочены"],
            ["done", "Завершены"],
            ["all", "Все задачи"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={cn(status === key && "active")}
              onClick={() => updateFilter({ status: key as TaskStatus })}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="list-toolbar task-toolbar">
          <SearchInput
            value={search}
            onChange={(value) => updateFilter({ search: value })}
            placeholder="Найти задачу…"
          />
          <div className="task-filter-controls">
            <Field label="Отдел">
              <Select
                aria-label="Отдел задач"
                value={department}
                onChange={(e) => updateFilter({ department: e.target.value })}
              >
                <option value="all">Все отделы</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {departmentNames[d]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Сотрудник">
              <Select
                aria-label="Сотрудник задач"
                value={employee}
                onChange={(e) => updateFilter({ employee: e.target.value })}
              >
                <option value="all">Все сотрудники</option>
                {data.employees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Сортировка">
              <Select
                aria-label="Сортировка задач"
                value={sort}
                onChange={(e) =>
                  updateFilter({ sort: e.target.value as TaskSort })
                }
              >
                <option value="due">По сроку</option>
                <option value="status">По статусу</option>
                <option value="priority">По приоритету</option>
                <option value="employee">По сотруднику</option>
              </Select>
            </Field>
            {filtered && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw size={14} />
                Сбросить
              </Button>
            )}
          </div>
        </div>
        {sort === "status" && (
          <p className="task-sort-hint">
            Сначала просроченные, затем в работе и завершённые. Внутри статуса —
            по сроку.
          </p>
        )}
        <div className="task-page-list">
          {list.length ? (
            list.map((t) => <TaskRow task={t} key={t.id} />)
          ) : (
            <Empty
              title="Задач в этой выборке нет"
              description="Измените фильтры или создайте новую задачу."
              action={
                filtered ? (
                  <Button variant="outline" onClick={resetFilters}>
                    <RotateCcw size={15} />
                    Сбросить фильтры
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/erp/tasks?create=1")}
                  >
                    <Plus size={15} />
                    Новая задача
                  </Button>
                )
              }
            />
          )}
        </div>
        <div className="pagination">
          <span>Задач в выборке: {list.length}</span>
          <span>Изменения сохраняются автоматически</span>
        </div>
      </section>
    </>
  );
}

const info: Record<
  string,
  {
    description: string;
    subtitle: string;
    icon: typeof Users;
    color: string;
    stats: [string, string, string][];
  }
> = {
  marketing: {
    description: "От внимания к доверию. От первого касания к покупке.",
    subtitle: "Кампании, контент и рост аудитории",
    icon: Target,
    color: "orange",
    stats: [
      ["Активных кампаний", "8", "Демонстрационный показатель"],
      ["ROAS", "4,8×", "Демонстрационный показатель"],
      ["Охват", "128 тыс.", "Демонстрационный показатель"],
    ],
  },
  purchasing: {
    description: "Нужные товары. Надёжные партнёры. Точные сроки.",
    subtitle: "Поставщики и пополнение ассортимента",
    icon: Building2,
    color: "green",
    stats: [
      ["Поставщиков", "12", "Демонстрационный показатель"],
      ["Поставок в пути", "4", "Демонстрационный показатель"],
      ["Средний срок", "7 дней", "Демонстрационный показатель"],
    ],
  },
  warehouse: {
    description: "Каждый товар на месте. Каждый заказ вовремя.",
    subtitle: "Остатки, комплектация и логистика",
    icon: Package,
    color: "blue",
    stats: [],
  },
  finance: {
    description: "Прозрачные цифры для уверенных решений.",
    subtitle: "Платежи и финансовый контроль",
    icon: Wallet,
    color: "violet",
    stats: [],
  },
  team: {
    description: "Люди, которые двигают бизнес вперёд.",
    subtitle: "Команда Young Unicorn",
    icon: Users,
    color: "violet",
    stats: [],
  },
};

export function Department() {
  const { department = "team" } = useParams();
  const preview = useAccessBoard((state) => !!state.previewEmployeeId);
  const canEdit = useDepartmentAction(
    department as (typeof departments)[number],
    "edit",
  );
  const createTask = () =>
    navigate(
      preview
        ? `/erp/departments/${department}?newTask=1`
        : `/erp/tasks?create=1&department=${department}`,
    );
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const item = info[department];
  if (!item)
    return (
      <Empty
        title="Отдел не найден"
        action={<Button onClick={() => navigate("/erp")}>На главную</Button>}
      />
    );
  const employees = data.employees.filter(
      (e) => department === "team" || e.department === department,
    ),
    tasks = data.tasks.filter(
      (t) => department === "team" || t.department === department,
    );
  const stats =
    department === "warehouse"
      ? [
          ["Товаров в каталоге", `${data.products.length}`, "Данные каталога"],
          [
            "Остаток, шт.",
            `${data.products.reduce((s, p) => s + p.stock, 0)}`,
            "Демонстрационный остаток",
          ],
          [
            "К сборке",
            `${data.orders.filter((o) => o.shipping === "new" || o.shipping === "processing").length}`,
            "Рассчитано из заказов",
          ],
        ]
      : department === "finance"
        ? [
            [
              "Поступления",
              money(
                data.orders
                  .filter(isRevenue)
                  .reduce((s, o) => s + orderTotal(o), 0),
                true,
              ),
              "Оплаченные неотменённые заказы",
            ],
            [
              "Ожидается оплата",
              money(
                data.orders
                  .filter(
                    (o) => o.payment === "unpaid" && o.shipping !== "cancelled",
                  )
                  .reduce((s, o) => s + orderTotal(o), 0),
                true,
              ),
              "Рассчитано из заказов",
            ],
            [
              "Заказов оплачено",
              `${data.orders.filter(isRevenue).length}`,
              "За всё время",
            ],
          ]
        : department === "team"
          ? [
              ["Специалистов", `${data.employees.length}`, "В команде"],
              [
                "Задач в работе",
                `${data.tasks.filter((t) => !t.done).length}`,
                "Во всех отделах",
              ],
              [
                "Задач завершено",
                `${data.tasks.filter((t) => t.done).length}`,
                "Общий результат",
              ],
            ]
          : item.stats;
  return (
    <>
      <PageHeading
        eyebrow="ОТДЕЛЫ КОМПАНИИ"
        title={departmentNames[department]}
        description={item.description}
        actions={
          canEdit && (
            <Button onClick={createTask}>
              <Plus size={17} />
              Новая задача
            </Button>
          )
        }
      />
      <div className="department-banner">
        <span className={cn("department-banner-icon", `soft-${item.color}`)}>
          <item.icon size={36} />
        </span>
        <div>
          <Badge tone={item.color}>Обзор отдела</Badge>
          <h2>{item.subtitle}</h2>
          <p>Сотрудники, показатели и связанные задачи в одном месте.</p>
        </div>
        <span className="department-watermark">
          <item.icon size={150} strokeWidth={0.7} />
        </span>
      </div>
      <div className="department-stats">
        {stats.map(([label, value, note]) => (
          <div className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="department-content">
        <section className="card">
          <SectionHeading
            title={department === "team" ? "Наша команда" : "Сотрудники отдела"}
            description={`${employees.length} ${employees.length === 1 ? "специалист" : "специалистов"}`}
          />
          <div className="employee-list">
            {employees.map((e) => (
              <div key={e.id}>
                <Avatar name={e.name} color={e.color} size="lg" />
                <div>
                  <strong>{e.name}</strong>
                  <span>{e.role}</span>
                </div>
                <Badge tone="green">В команде</Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <SectionHeading
            title="Задачи отдела"
            action={
              canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Создать задачу отдела"
                  onClick={createTask}
                >
                  <Plus size={17} />
                </Button>
              )
            }
          />
          {tasks.length ? (
            tasks.map((t) => <TaskRow key={t.id} task={t} />)
          ) : (
            <Empty
              title="Задач пока нет"
              description={
                canEdit ? "Создайте первую задачу для отдела." : undefined
              }
            />
          )}
        </section>
      </div>
      {department === "warehouse" && (
        <section className="card catalog-card">
          <SectionHeading
            title="Каталог и остатки"
            description="Демонстрационный справочник товаров; складские движения появятся на следующем этапе."
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Товар</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td className="muted">{p.sku}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category}</td>
                    <td>{money(p.price)}</td>
                    <td>
                      <Badge tone={p.stock < 25 ? "orange" : "green"}>
                        {p.stock} шт.
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export function Projects() {
  const { data } = useERP();
  const { projects, selectedProjectId } = useWorkspace();
  const project = projects.find((item) => item.id === selectedProjectId);
  const empty = !projects.some((item) => !item.archived) ||
    (!!project && !projectTasks(data.tasks, project).length &&
      !data.deals.some(({ id }) => project.dealIds.includes(id)));
  return (
    <>
      <PageHeading
        title="Проекты"
        description="Выберите проект, чтобы открыть его доску, бэклог и спринт."
        actions={
          <Link className="btn btn-outline" to="/erp/tasks">
            Все задачи
          </Link>
        }
      />
      <ProjectNavigation showEmpty={empty} />
      {!empty && <HomeDealBoard />}
    </>
  );
}

export function Profile() {
  const preferences = usePreferences();
  const [name, setName] = useState(preferences.name),
    [email, setEmail] = useState(preferences.email),
    [role, setRole] = useState(preferences.role),
    [avatarSeed, setAvatarSeed] = useState(preferences.avatarSeed),
    [error, setError] = useState("");
  const save = useSaveAction();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void save.run(() => {
      try {
        const saved = preferences.update({ name, email, role, avatarSeed });
        setError(saved ? "" : "Не удалось сохранить профиль в браузере.");
        return saved;
      } catch {
        setError("Укажите имя и должность от 2 символов и корректный email.");
        return false;
      }
    });
  };
  return (
    <>
      <PageHeading
        eyebrow="РАБОЧЕЕ ПРОСТРАНСТВО"
        title="Личный кабинет"
        description="Управляйте данными своего профиля."
      />
      <form className="card settings-card erp-profile" onSubmit={submit}>
        <SectionHeading
          title="Мой профиль"
          description="Эти данные используются в интерфейсе"
        />
        <div className="profile-preview">
          <Avatar name={name} size="lg" seed={avatarSeed} />
          <div>
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <Badge tone="violet">Демо-аккаунт</Badge>
        </div>
        <div className="nova-profile-avatar-actions">
          <AvatarPicker name={name} onChoose={setAvatarSeed} />
          {avatarSeed && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setAvatarSeed(undefined)}>
              Вернуть стандартный
            </Button>
          )}
        </div>
        <Field label="Имя и фамилия">
          <Input
            required
            minLength={2}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email профиля">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Должность">
          <Input
            required
            minLength={2}
            maxLength={80}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </Field>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <SaveButton status={save.status}>Сохранить профиль</SaveButton>
      </form>
    </>
  );
}

export function Settings() {
  const preferences = usePreferences();
  const { resetData, data } = useERP();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="РАБОЧЕЕ ПРОСТРАНСТВО"
        title="Настройки"
        description="Внешний вид и управление демоверсией."
        actions={
          <Link className="btn btn-outline" to="/erp/profile">
            Личный кабинет
          </Link>
        }
      />
      <div className="settings-grid">
        <section className="card settings-card">
          <SectionHeading
            title="Внешний вид"
            description="Тема рабочего пространства"
          />
          <fieldset className="erp-theme-options">
            <legend>Тема ERP</legend>
            {(["light", "dark"] as const).map((theme) => (
              <label key={theme}>
                <input
                  type="radio"
                  name="erp-theme"
                  value={theme}
                  checked={preferences.theme === theme}
                  onChange={() => preferences.update({ theme })}
                />
                {theme === "light" ? "Светлая" : "Чёрная"}
              </label>
            ))}
          </fieldset>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!preferences.welcomeHidden}
              onChange={(event) =>
                preferences.update({ welcomeHidden: !event.target.checked })
              }
            />
            Показывать блок «Впервые в ERP?» на главной
          </label>
        </section>
        <section className="card settings-card">
          <SectionHeading
            title="Демонстрационные данные"
            description="Все изменения хранятся в этом браузере"
          />
          <div className="storage-info">
            <ShieldCheck size={20} />
            <p>
              Версия данных: {data.version}
              <br />
              {data.orders.length} заказов · {data.customers.length} клиентов
            </p>
          </div>
          <p className="form-hint">
            Сброс удалит ваши изменения и восстановит исходный набор данных.
            Профиль и настройки внешнего вида сохранятся.
          </p>
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <RotateCcw size={15} />
            Сбросить демоданные
          </Button>
        </section>
      </div>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Восстановить демоданные?"
        description="Записи будут заменены исходным набором. Для подтверждения удерживайте кнопку."
      >
        <div className="dialog-footer">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Отмена
          </Button>
          <HoldButton
            danger
            onConfirm={() => {
              resetData();
              setConfirm(false);
              toast.success("Демонстрационные данные восстановлены");
            }}
          >
            Сбросить данные
          </HoldButton>
        </div>
      </Dialog>
    </>
  );
}
