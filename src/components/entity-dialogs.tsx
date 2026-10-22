import { useState } from "react";
import { EmployeeChip } from "./people";
import { StageMenu } from "./stage-menu";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Package,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  ShoppingBag,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useERP } from "../data/store";
import {
  channels,
  stages,
  stageNames,
  departmentNames,
  departments,
  paymentNames,
  shippingNames,
  customerInputSchema,
  orderInputSchema,
  dealInputSchema,
  taskInputSchema,
  type CustomerInput,
  type OrderInput,
  type DealInput,
  type TaskInput,
  type Order,
  type Customer,
  type Deal,
  type Task,
} from "../data/schema";
import { orderTotal, subtotal, isRevenue } from "../data/selectors";
import { money, today, shiftDate, dateLabel } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Input,
  Select,
  Textarea,
} from "./ui";

function SaveFooter({
  onClose,
  isNew,
  children,
}: {
  onClose: () => void;
  isNew: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="dialog-footer">
      <Button type="button" variant="outline" onClick={onClose}>
        Отмена
      </Button>
      <div className="flex flex-wrap gap-2">
        {children}
        <Button type="submit">
          <Check size={16} />
          {isNew ? "Создать" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
function Managers({
  value,
  onChange,
  all = false,
}: {
  value: string;
  onChange: (id: string) => void;
  all?: boolean;
}) {
  const employees = useERP((s) => s.data.employees);
  return (
    <Select
      aria-label="Менеджер"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {all && <option value="all">Все менеджеры</option>}
      {employees
        .filter((e) => e.department === "sales")
        .map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
    </Select>
  );
}
function ItemsEditor({
  items,
  onChange,
  error,
}: {
  items: OrderInput["items"];
  onChange: (items: OrderInput["items"]) => void;
  error?: string;
}) {
  const products = useERP((s) => s.data.products);
  return (
    <div className="items-editor">
      <div className="subsection-title">
        <h3>Товары</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([
              ...items,
              {
                productId: products[0].id,
                quantity: 1,
                unitPrice: products[0].price,
              },
            ])
          }
        >
          <Plus size={15} />
          Добавить товар
        </Button>
      </div>
      {items.map((item, index) => (
        <div className="item-line" key={index}>
          <Select
            aria-label={`Товар ${index + 1}`}
            value={item.productId}
            onChange={(e) => {
              const product = products.find((p) => p.id === e.target.value)!;
              onChange(
                items.map((line, i) =>
                  i === index
                    ? {
                        ...line,
                        productId: product.id,
                        unitPrice: product.price,
                      }
                    : line,
                ),
              );
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {money(p.price)}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            aria-label={`Количество ${index + 1}`}
            min={1}
            max={999}
            value={item.quantity}
            onChange={(e) =>
              onChange(
                items.map((line, i) =>
                  i === index
                    ? { ...line, quantity: Number(e.target.value) }
                    : line,
                ),
              )
            }
          />
          <span className="item-price">
            {money(item.quantity * item.unitPrice)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Удалить товар ${index + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {items.some(
        (i) =>
          i.quantity < 1 || i.quantity > 999 || !Number.isInteger(i.quantity),
      ) && <p className="field-error">Количество: целое число от 1 до 999.</p>}
    </div>
  );
}
function History({ entityId }: { entityId: string }) {
  const activities = useERP((s) => s.data.activities)
    .filter((a) => a.entityId === entityId)
    .slice(0, 5);
  return (
    activities.length > 0 && (
      <div className="entity-history">
        <h3>История изменений</h3>
        {activities.map((a) => (
          <div key={a.id}>
            <Clock3 size={13} />
            <span>{a.title}</span>
            <time>
              {new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Moscow",
              }).format(new Date(a.createdAt))}
            </time>
          </div>
        ))}
      </div>
    )
  );
}

function CustomerForm({
  entity,
  close,
}: {
  entity?: Customer;
  close: () => void;
}) {
  const navigate = useNavigate();
  const { data, saveCustomer } = useERP();
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: entity || {
      name: "",
      email: "",
      phone: "+7 ",
      city: "",
      segment: "Новый",
      managerId: "e1",
      notes: "",
    },
  });
  const orders = data.orders.filter((o) => o.customerId === entity?.id),
    deals = data.deals.filter((d) => d.customerId === entity?.id);
  return (
    <form
      onSubmit={form.handleSubmit((value) => {
        try {
          saveCustomer(value, entity?.id);
          toast.success(
            entity ? "Данные клиента обновлены" : "Клиент добавлен",
          );
          close();
        } catch {
          toast.error("Не удалось сохранить клиента. Проверьте данные.");
        }
      })}
    >
      <div className="dialog-body">
        {entity && (
          <div className="customer-summary">
            <Avatar name={entity.name} size="lg" />
            <div>
              <h3>{entity.name}</h3>
              <span>
                {entity.city} · С нами с {dateLabel(entity.createdAt, true)}
              </span>
            </div>
            <Badge tone="violet">{entity.segment}</Badge>
          </div>
        )}
        {entity && (
          <div className="mini-stats">
            <div>
              <span>Заказов</span>
              <strong>{orders.length}</strong>
            </div>
            <div>
              <span>Покупки</span>
              <strong>
                {money(
                  orders
                    .filter(isRevenue)
                    .reduce((s, o) => s + orderTotal(o), 0),
                )}
              </strong>
            </div>
            <div>
              <span>Сделок</span>
              <strong>{deals.length}</strong>
            </div>
          </div>
        )}
        <div className="form-grid">
          <Field
            label="Имя или название компании"
            error={form.formState.errors.name?.message}
          >
            <Input
              {...form.register("name")}
              placeholder="Например, Анна Морозова"
            />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              {...form.register("email")}
              placeholder="client@example.com"
            />
          </Field>
          <Field label="Телефон" error={form.formState.errors.phone?.message}>
            <Input {...form.register("phone")} placeholder="+7 999 123-45-67" />
          </Field>
          <Field label="Город" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} placeholder="Москва" />
          </Field>
          <Field label="Сегмент">
            <Select {...form.register("segment")}>
              {["Новый", "Постоянный", "VIP", "B2B"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ответственный">
            <Managers
              value={form.watch("managerId")}
              onChange={(v) => form.setValue("managerId", v)}
            />
          </Field>
        </div>
        <Field label="Заметки">
          <Textarea
            {...form.register("notes")}
            placeholder="Предпочтения клиента и важные детали"
          />
        </Field>
        {entity && (
          <div className="related-list">
            <h3>Последние заказы</h3>
            {orders.length ? (
              orders.slice(0, 4).map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => navigate(`/sales/orders?open=${o.id}`)}
                >
                  <ShoppingBag size={15} />
                  <span>{o.number}</span>
                  <strong>{money(orderTotal(o))}</strong>
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <p>У клиента пока нет заказов.</p>
            )}
            <h3>Связанные сделки</h3>
            {deals.length ? (
              deals.slice(0, 4).map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => navigate(`/sales/pipeline?open=${d.id}`)}
                >
                  <span>{d.title}</span>
                  <Badge tone="violet">{stageNames[d.stage]}</Badge>
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <p>У клиента пока нет сделок.</p>
            )}
          </div>
        )}
      </div>
      <SaveFooter onClose={close} isNew={!entity} />
    </form>
  );
}

function OrderForm({
  entity,
  close,
  presetCustomer,
}: {
  entity?: Order;
  close: () => void;
  presetCustomer?: string;
}) {
  const navigate = useNavigate();
  const { data, saveOrder } = useERP();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<OrderInput>({
    resolver: zodResolver(orderInputSchema),
    defaultValues: entity || {
      customerId: presetCustomer || data.customers[0]?.id || "",
      managerId: "e1",
      channel: "Сайт",
      items: [
        {
          productId: data.products[0].id,
          quantity: 1,
          unitPrice: data.products[0].price,
        },
      ],
      discount: 0,
      shippingCost: 0,
      payment: "unpaid",
      shipping: "new",
      notes: "",
    },
  });
  const value = form.watch();
  return (
    <form
      onSubmit={(e) => {
        setSubmitted(true);
        void form.handleSubmit((input) => {
          try {
            saveOrder(input, entity?.id);
            toast.success(entity ? "Заказ обновлён" : "Заказ создан");
            close();
          } catch {
            toast.error("Не удалось сохранить заказ. Проверьте данные.");
          }
        })(e);
      }}
    >
      <div className="dialog-body">
        <div className="order-summary">
          <div className="entity-icon">
            <Package size={25} />
          </div>
          <div>
            <span>
              {entity
                ? `Создан ${dateLabel(entity.createdAt, true)}`
                : "Новый заказ"}
            </span>
            <h3>{money(orderTotal(value))}</h3>
          </div>
          <Badge tone={value.payment === "paid" ? "green" : "orange"}>
            {paymentNames[value.payment]}
          </Badge>
        </div>
        <div className="form-grid">
          <Field
            label="Клиент"
            error={form.formState.errors.customerId?.message}
          >
            <Select {...form.register("customerId")}>
              <option value="" disabled>
                Выберите клиента
              </option>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Менеджер">
            <Managers
              value={value.managerId}
              onChange={(v) => form.setValue("managerId", v)}
            />
          </Field>
          <Field label="Канал продаж">
            <Select {...form.register("channel")}>
              {channels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Оплата">
            <Select {...form.register("payment")}>
              {Object.entries(paymentNames).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Статус доставки">
            <Select {...form.register("shipping")}>
              {Object.entries(shippingNames).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Доставка, ₽"
            error={form.formState.errors.shippingCost?.message}
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={value.shippingCost / 100}
              onChange={(e) =>
                form.setValue(
                  "shippingCost",
                  Math.round(Number(e.target.value) * 100),
                )
              }
            />
          </Field>
        </div>
        <ItemsEditor
          items={value.items}
          onChange={(items) =>
            form.setValue("items", items, { shouldValidate: submitted })
          }
          error={
            form.formState.errors.items?.message ||
            form.formState.errors.items?.root?.message
          }
        />
        <div className="order-totals">
          <Field
            label="Скидка, ₽"
            error={form.formState.errors.discount?.message}
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={value.discount / 100}
              onChange={(e) =>
                form.setValue(
                  "discount",
                  Math.round(Number(e.target.value) * 100),
                  { shouldValidate: submitted },
                )
              }
            />
          </Field>
          <div>
            <p>
              <span>Товары</span>
              <span>{money(subtotal(value.items))}</span>
            </p>
            <p>
              <span>Доставка</span>
              <span>{money(value.shippingCost)}</span>
            </p>
            <p>
              <span>Скидка</span>
              <span>−{money(value.discount)}</span>
            </p>
            <p className="total-row">
              <strong>Итого</strong>
              <strong>{money(orderTotal(value))}</strong>
            </p>
          </div>
        </div>
        <Field label="Комментарий к заказу">
          <Textarea
            {...form.register("notes")}
            placeholder="Детали доставки и пожелания клиента"
          />
        </Field>
        {entity && (
          <>
            <button
              type="button"
              className="text-link"
              onClick={() =>
                navigate(`/sales/customers?open=${entity.customerId}`)
              }
            >
              Открыть карточку клиента
              <ArrowUpRight size={14} />
            </button>
            <History entityId={entity.id} />
          </>
        )}
      </div>
      <SaveFooter onClose={close} isNew={!entity} />
    </form>
  );
}

type DealPanelProps = {
  entity?: Deal;
  close: () => void;
  initialStage?: Deal["stage"];
};
function DealForm({ entity, close, initialStage }: DealPanelProps) {
  const { data, saveDeal } = useERP();
  const form = useForm<DealInput>({
    resolver: zodResolver(dealInputSchema),
    defaultValues: entity || {
      title: "",
      customerId: data.customers[0]?.id || "",
      managerId: "e1",
      stage: initialStage || "new",
      channel: "B2B",
      expectedAt: shiftDate(today(), 7),
      items: [
        {
          productId: data.products[0].id,
          quantity: 1,
          unitPrice: data.products[0].price,
        },
      ],
      notes: "",
    },
  });
  const values = form.watch();
  return (
    <form
      onSubmit={form.handleSubmit((value) => {
        try {
          saveDeal(value, entity?.id);
          toast.success(entity ? "Сделка обновлена" : "Сделка создана");
          close();
        } catch {
          toast.error("Не удалось сохранить сделку. Проверьте данные.");
        }
      })}
    >
      <div className="dialog-body simplified-deal-editor">
        <Field
          label="Название сделки"
          error={form.formState.errors.title?.message}
        >
          <Input
            autoFocus
            {...form.register("title")}
            placeholder="Например, комплектация гостиной"
          />
        </Field>
        <div className="form-grid">
          <Field label="Клиент">
            <Select aria-label="Клиент сделки" {...form.register("customerId")}>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Этап">
            <StageMenu
              label="Этап"
              value={values.stage}
              onChange={(stage) => form.setValue("stage", stage)}
            />
          </Field>
        </div>
        <ItemsEditor
          items={values.items}
          onChange={(items) =>
            form.setValue("items", items, { shouldValidate: true })
          }
          error={form.formState.errors.items?.message}
        />
        <div className="deal-total">
          <span>Сумма сделки</span>
          <strong>{money(subtotal(values.items))}</strong>
        </div>
        <details
          className="deal-advanced"
          open={!!form.formState.errors.expectedAt || undefined}
        >
          <summary>
            Дополнительно <span>Менеджер, срок, канал и заметки</span>
          </summary>
          <div className="advanced-fields">
            <div className="form-grid">
              <Field label="Менеджер">
                <Managers
                  value={values.managerId}
                  onChange={(id) => form.setValue("managerId", id)}
                />
              </Field>
              <Field
                label="Ожидаемое закрытие"
                error={form.formState.errors.expectedAt?.message}
              >
                <Input type="date" {...form.register("expectedAt")} />
              </Field>
              <Field label="Канал">
                <Select {...form.register("channel")}>
                  {channels.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Заметки">
              <Textarea
                maxLength={3000}
                {...form.register("notes")}
                placeholder="Следующий шаг и договорённости"
              />
            </Field>
          </div>
        </details>
      </div>
      <SaveFooter onClose={close} isNew={!entity} />
    </form>
  );
}
function DealPanel({ entity, close, initialStage }: DealPanelProps) {
  const [editing, setEditing] = useState(!entity);
  const { data, moveDeal, convertDeal } = useERP();
  const navigate = useNavigate();
  if (!entity || editing)
    return (
      <DealForm entity={entity} close={close} initialStage={initialStage} />
    );
  const customer = data.customers.find((c) => c.id === entity.customerId)!,
    employee = data.employees.find((e) => e.id === entity.managerId)!;
  return (
    <>
      <div className="dialog-body deal-overview">
        <div className="deal-overview-heading">
          <Badge
            tone={
              entity.stage === "won"
                ? "green"
                : entity.stage === "lost"
                  ? "neutral"
                  : "violet"
            }
          >
            {stageNames[entity.stage]}
          </Badge>
          <span>{entity.channel}</span>
          <h3>{entity.title}</h3>
          <strong>{money(subtotal(entity.items))}</strong>
        </div>
        <button
          className="deal-customer-link"
          onClick={() => navigate("/sales/customers?open=" + customer.id)}
        >
          <Avatar name={customer.name} />
          <div>
            <small>Клиент</small>
            <strong>{customer.name}</strong>
          </div>
          <ArrowUpRight size={16} />
        </button>
        <div className="deal-quick-fields">
          <Field label="Текущий этап">
            <StageMenu
              label="Текущий этап"
              value={entity.stage}
              onChange={(stage) => {
                moveDeal(entity.id, stage);
                toast.success("Этап сделки обновлён");
              }}
            />
          </Field>
          <div className="deal-owner">
            <span>Ответственный</span>
            <EmployeeChip employee={employee} />
            <small>Закрытие: {dateLabel(entity.expectedAt)}</small>
          </div>
        </div>
        {entity.notes && (
          <div className="deal-next-step">
            <span>Заметки и следующий шаг</span>
            <p>{entity.notes}</p>
          </div>
        )}
        {(entity.stage === "won" || entity.orderId) && (
          <div className="conversion-panel">
            <CircleCheck size={21} />
            <div>
              <strong>
                {entity.orderId ? "Заказ связан со сделкой" : "Сделка выиграна"}
              </strong>
              <p>
                {entity.orderId
                  ? "Перейдите к оплате и доставке."
                  : "Клиент и товары готовы для переноса в заказ."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                try {
                  const orderId = entity.orderId || convertDeal(entity.id);
                  navigate("/sales/orders?open=" + orderId);
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }}
            >
              {entity.orderId ? "Открыть заказ" : "Создать заказ"}
              <ArrowUpRight size={14} />
            </Button>
          </div>
        )}
        <details className="deal-advanced">
          <summary>
            Товары и состав сделки{" "}
            <span>{entity.items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
          </summary>
          <div className="deal-product-list">
            {entity.items.map((item, i) => (
              <div key={i}>
                <span>
                  {data.products.find((p) => p.id === item.productId)?.name}
                  <small>
                    {item.quantity} шт. × {money(item.unitPrice)}
                  </small>
                </span>
                <strong>{money(item.quantity * item.unitPrice)}</strong>
              </div>
            ))}
          </div>
        </details>
        <details className="deal-advanced">
          <summary>История изменений</summary>
          <History entityId={entity.id} />
        </details>
      </div>
      <div className="dialog-footer">
        <Button variant="outline" onClick={close}>
          Закрыть
        </Button>
        <Button onClick={() => setEditing(true)}>Редактировать сделку</Button>
      </div>
    </>
  );
}

function TaskForm({ entity, close }: { entity?: Task; close: () => void }) {
  const { data, saveTask } = useERP();
  const [params] = useSearchParams();
  const department = departments.includes(
    params.get("department") as Task["department"],
  )
    ? (params.get("department") as Task["department"])
    : "sales";
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: entity || {
      title: "",
      employeeId:
        data.employees.find((e) => e.department === department)?.id || "e1",
      department,
      dueAt: today(),
      priority: "medium",
      done: false,
      notes: "",
    },
  });
  return (
    <form
      onSubmit={form.handleSubmit((value) => {
        try {
          saveTask(value, entity?.id);
          toast.success(entity ? "Задача обновлена" : "Задача создана");
          close();
        } catch {
          toast.error("Не удалось сохранить задачу");
        }
      })}
    >
      <div className="dialog-body">
        <Field
          label="Название задачи"
          error={form.formState.errors.title?.message}
        >
          <Input {...form.register("title")} placeholder="Что нужно сделать?" />
        </Field>
        <div className="form-grid">
          <Field label="Исполнитель">
            <Select {...form.register("employeeId")}>
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Отдел">
            <Select {...form.register("department")}>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {departmentNames[d]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Срок" error={form.formState.errors.dueAt?.message}>
            <Input type="date" {...form.register("dueAt")} />
          </Field>
          <Field label="Приоритет">
            <Select {...form.register("priority")}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </Select>
          </Field>
        </div>
        <Field label="Описание">
          <Textarea
            {...form.register("notes")}
            placeholder="Контекст и ожидаемый результат"
          />
        </Field>
        <label className="checkbox-label">
          <input type="checkbox" {...form.register("done")} />
          Задача завершена
        </label>
        {entity && <History entityId={entity.id} />}
      </div>
      <SaveFooter onClose={close} isNew={!entity} />
    </form>
  );
}

export function EntityDialogs() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useERP((s) => s.data);
  const id = params.get("open"),
    creating = params.get("create") === "1",
    open = !!id || creating;
  const type = location.pathname.includes("orders")
    ? "order"
    : location.pathname.includes("customers")
      ? "customer"
      : location.pathname.includes("pipeline")
        ? "deal"
        : location.pathname === "/tasks"
          ? "task"
          : null;
  const close = () => navigate(location.pathname, { replace: true });
  if (!open || !type) return null;
  const entity = id
    ? (type === "order"
        ? data.orders
        : type === "customer"
          ? data.customers
          : type === "deal"
            ? data.deals
            : data.tasks
      ).find((e) => e.id === id)
    : undefined;
  const title =
    type === "order"
      ? entity
        ? `Заказ ${(entity as Order).number}`
        : "Новый заказ"
      : type === "customer"
        ? entity
          ? "Карточка клиента"
          : "Новый клиент"
        : type === "deal"
          ? entity
            ? "Карточка сделки"
            : "Новая сделка"
          : entity
            ? "Карточка задачи"
            : "Новая задача";
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
      title={id && !entity ? "Запись не найдена" : title}
      description={
        type === "order"
          ? "Товары, оплата и доставка в одном месте"
          : type === "deal"
            ? "От первого контакта до нового заказа"
            : undefined
      }
      wide={type === "order"}
    >
      {id && !entity ? (
        <Empty
          title="Запись не найдена"
          description="Возможно, данные были сброшены. Закройте окно и обновите список."
        />
      ) : type === "order" ? (
        <OrderForm
          key={id || "new-order"}
          entity={entity as Order | undefined}
          close={close}
          presetCustomer={params.get("customer") || undefined}
        />
      ) : type === "customer" ? (
        <CustomerForm
          key={id || "new-customer"}
          entity={entity as Customer | undefined}
          close={close}
        />
      ) : type === "deal" ? (
        <DealPanel
          key={id || "new-deal"}
          entity={entity as Deal | undefined}
          close={close}
          initialStage={
            stages.includes(params.get("initialStage") as Deal["stage"])
              ? (params.get("initialStage") as Deal["stage"])
              : undefined
          }
        />
      ) : (
        <TaskForm
          key={id || "new-task"}
          entity={entity as Task | undefined}
          close={close}
        />
      )}
    </Dialog>
  );
}
