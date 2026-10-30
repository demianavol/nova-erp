import type { Data, Order, Product } from "./schema";
import { enrichDemoWorkspace } from "./demo-activities";
import { channels, departments } from "./schema";
type TaskDepartment = (typeof departments)[number];
import { shiftDate, today } from "../lib/utils";

export function seedData(anchor = today()): Data {
  const employees: Data["employees"] = [
    {
      id: "e1",
      name: "Александр Волков",
      role: "Руководитель продаж",
      department: "sales",
      color: "violet",
    },
    {
      id: "e2",
      name: "Анна Смирнова",
      role: "Менеджер по продажам",
      department: "sales",
      color: "pink",
    },
    {
      id: "e3",
      name: "Максим Орлов",
      role: "Менеджер B2B",
      department: "sales",
      color: "blue",
    },
    {
      id: "e4",
      name: "Елена Ким",
      role: "Руководитель маркетинга",
      department: "marketing",
      color: "orange",
    },
    {
      id: "e5",
      name: "Дмитрий Соколов",
      role: "Менеджер по закупкам",
      department: "purchasing",
      color: "green",
    },
    {
      id: "e6",
      name: "Ольга Петрова",
      role: "Руководитель склада",
      department: "warehouse",
      color: "blue",
    },
    {
      id: "e7",
      name: "Мария Белова",
      role: "Финансовый менеджер",
      department: "finance",
      color: "pink",
    },
  ];
  const catalog: [string, string, number, string][] = [
    ["Кресло Lounge", "Мебель", 24900, "#cec1ad"],
    ["Лампа Arc", "Освещение", 8900, "#d1b68f"],
    ["Ваза Forma", "Декор", 3400, "#d9c8bc"],
    ["Столик Pebble", "Мебель", 12900, "#a9937b"],
    ["Плед Soft", "Текстиль", 4900, "#bcb5ca"],
    ["Свеча Amber", "Декор", 1900, "#d3ae78"],
    ["Стул Nordic", "Мебель", 11900, "#c1b491"],
    ["Зеркало Oval", "Декор", 7900, "#b3b8b6"],
    ["Торшер Line", "Освещение", 15900, "#b8b1a8"],
    ["Подушка Cloud", "Текстиль", 2400, "#d4c6be"],
    ["Ковёр Terra", "Текстиль", 14900, "#c3a490"],
    ["Набор чашек Mist", "Кухня", 3600, "#b8c7be"],
    ["Полка Float", "Мебель", 5900, "#b9a388"],
    ["Постер Balance", "Декор", 2800, "#b9bdce"],
    ["Органайзер Desk", "Декор", 2200, "#c3bbac"],
    ["Графин Clear", "Кухня", 3200, "#b5c9ce"],
    ["Стол Oak", "Мебель", 38900, "#ba9d7e"],
    ["Лампа Mushroom", "Освещение", 6900, "#c0b8d5"],
    ["Комплект Linen", "Текстиль", 10900, "#d5cfbf"],
    ["Тарелки Sand", "Кухня", 5400, "#cbb7a2"],
    ["Пуф Round", "Мебель", 8900, "#acb8a2"],
    ["Кашпо Stone", "Декор", 2700, "#bfbcb5"],
    ["Бра Halo", "Освещение", 7200, "#c9b88b"],
    ["Полотенца Pure", "Текстиль", 3900, "#b2c4c5"],
  ];
  const products: Product[] = catalog.map(
    ([name, category, price, color], i) => ({
      id: `p${i + 1}`,
      name,
      category,
      price: price * 100,
      color,
      sku: `FR-${String(i + 101).padStart(4, "0")}`,
      stock: 12 + ((i * 17) % 130),
    }),
  );
  const firstNames = [
    "Анастасия",
    "Михаил",
    "Екатерина",
    "Андрей",
    "Виктория",
    "Артём",
    "Дарья",
    "Никита",
    "София",
    "Иван",
    "Полина",
    "Сергей",
  ];
  const lastNames = [
    "Морозова",
    "Лебедев",
    "Новикова",
    "Кузнецов",
    "Михайлова",
    "Фёдоров",
    "Соколова",
    "Попов",
    "Васильева",
    "Смирнов",
    "Волкова",
    "Павлов",
  ];
  const cities = [
    "Москва",
    "Санкт-Петербург",
    "Казань",
    "Екатеринбург",
    "Новосибирск",
    "Краснодар",
  ];
  const customers: Data["customers"] = Array.from({ length: 60 }, (_, i) => ({
    id: `c${i + 1}`,
    name:
      i >= 54
        ? [
            "Студия «Точка»",
            "Отель «Лес»",
            "Бюро Habitat",
            "Кафе «Утро»",
            "Апартаменты Forma",
            "Студия North",
          ][i - 54]
        : `${firstNames[i % 12]} ${lastNames[(i + Math.floor(i / 12) * 2) % 12]}`,
    email: `client${i + 1}@example.com`,
    phone: `+7 9${String(150000000 + i * 17231).slice(0, 9)}`,
    city: cities[i % 6],
    segment:
      i >= 54
        ? "B2B"
        : i % 7 === 0
          ? "VIP"
          : i % 3 === 0
            ? "Новый"
            : "Постоянный",
    managerId: `e${(i % 3) + 1}`,
    notes: i % 4 === 0 ? "Предпочитает связь в первой половине дня." : "",
    createdAt: shiftDate(anchor, -(i * 3 + 1)),
  }));
  const orders: Order[] = Array.from({ length: 240 }, (_, i): Order => {
    const daysAgo = i < 70 ? i % 30 : 30 + ((i * 7) % 150);
    const product = products[(i * 7) % 24];
    const items = [
      {
        productId: product.id,
        quantity: 1 + (i % 3),
        unitPrice: product.price,
      },
    ];
    if (i % 3 === 0) {
      const other = products[(i * 7 + 5) % 24];
      items.push({ productId: other.id, quantity: 1, unitPrice: other.price });
    }
    const cancelled = i % 19 === 0;
    return {
      id: `o${i + 1}`,
      number: `NV-${10480 - i}`,
      customerId: `c${(i % 60) + 1}`,
      managerId: `e${(i % 3) + 1}`,
      channel: channels[i % 4],
      items,
      discount: i % 5 === 0 ? 50000 : 0,
      shippingCost: i % 3 === 0 ? 0 : 49000,
      payment: i % 7 === 0 ? "unpaid" : "paid",
      shipping: cancelled
        ? "cancelled"
        : daysAgo > 7
          ? "delivered"
          : (["new", "processing", "shipped", "delivered"] as const)[i % 4],
      notes: i % 8 === 0 ? "Позвонить за час до доставки." : "",
      createdAt: shiftDate(anchor, -daysAgo),
      updatedAt: `${shiftDate(anchor, -daysAgo)}T10:00:00.000Z`,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const dealStages = [
    "new",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ] as const;
  const deals: Data["deals"] = Array.from({ length: 28 }, (_, i) => ({
    id: `d${i + 1}`,
    title: [
      "Комплектация гостиной",
      "Новая коллекция для студии",
      "Мебель для апартаментов",
      "Свет для нового офиса",
      "Обновление интерьера",
      "Подарочные наборы",
      "Текстиль для отеля",
    ][i % 7],
    customerId: `c${((i * 7) % 60) + 1}`,
    managerId: `e${(i % 3) + 1}`,
    channel: channels[i % 4],
    stage: dealStages[i % 6],
    expectedAt: shiftDate(anchor, (i % 12) - 2),
    items: [
      {
        productId: products[i % 24].id,
        quantity: 2 + (i % 5),
        unitPrice: products[i % 24].price,
      },
    ],
    notes:
      i % 2
        ? "Обсудить сроки поставки и условия комплектации."
        : "Клиент заинтересован в новой коллекции.",
    createdAt: shiftDate(anchor, -((i % 25) + 1)),
  }));
  const titles = [
    "Согласовать предложение для студии «Точка»",
    "Проверить оплаты по новым заказам",
    "Связаться с клиентами по доставке",
    "Подготовить отчёт по рекламным кампаниям",
    "Согласовать поставку новой коллекции",
    "Провести инвентаризацию зоны А",
    "Сверить платежи за неделю",
    "Обновить условия для постоянных клиентов",
    "Подготовить подборку для B2B",
    "Проверить остатки бестселлеров",
    "Запустить осеннюю рассылку",
    "Согласовать цены с поставщиком",
    "Обновить карточки товаров",
    "Проверить возвраты",
    "Подготовить план продаж",
    "Обсудить адаптацию нового сотрудника",
    "Сверить документы поставки",
    "Проверить качество упаковки",
  ];
  const assignments: [string, TaskDepartment][] = [
    ["e1", "sales"],
    ["e7", "finance"],
    ["e2", "sales"],
    ["e4", "marketing"],
    ["e5", "purchasing"],
    ["e6", "warehouse"],
    ["e7", "finance"],
    ["e2", "sales"],
    ["e3", "sales"],
    ["e6", "warehouse"],
    ["e4", "marketing"],
    ["e5", "purchasing"],
    ["e4", "marketing"],
    ["e6", "warehouse"],
    ["e1", "sales"],
    ["e1", "team"],
    ["e5", "purchasing"],
    ["e6", "warehouse"],
  ];
  const tasks: Data["tasks"] = titles.map((title, i) => ({
    id: `t${i + 1}`,
    title,
    employeeId: assignments[i][0],
    department: assignments[i][1],
    dueAt: shiftDate(anchor, (i % 7) - 2),
    priority: (["high", "medium", "low"] as const)[i % 3],
    done: i > 13,
    notes: "",
    createdAt: shiftDate(anchor, -4),
  }));
  return enrichDemoWorkspace({
    version: 1,
    seededAt: anchor,
    employees,
    products,
    customers,
    orders,
    deals,
    tasks,
    notifications: [
      {
        id: "n1",
        title: "Новый заказ Ozon",
        description: "Заказ NV-10479 готов к обработке",
        read: false,
        route: "/erp/sales/orders?open=o2",
        type: "order",
        createdAt: `${anchor}T09:40:00Z`,
      },
      {
        id: "n2",
        title: "Есть задачи с истёкшим сроком",
        description: "Проверьте приоритеты команды",
        read: false,
        route: "/erp/tasks",
        type: "task",
        createdAt: `${anchor}T08:10:00Z`,
      },
      {
        id: "n3",
        title: "Добро пожаловать в NOVA",
        description: "Команда и продажи теперь в одном пространстве",
        read: true,
        route: "/",
        type: "system",
        createdAt: `${shiftDate(anchor, -1)}T10:00:00Z`,
      },
    ],
    activities: [
      {
        id: "a1",
        title: "Анна Смирнова обработала заказ NV-10479",
        entityId: "o2",
        route: "/erp/sales/orders?open=o2",
        type: "order",
        createdAt: `${anchor}T09:40:00Z`,
      },
      {
        id: "a2",
        title: "Максим Орлов обновил предложение клиенту",
        entityId: "d3",
        route: "/erp/sales/pipeline?open=d3",
        type: "deal",
        createdAt: `${anchor}T09:15:00Z`,
      },
      {
        id: "a3",
        title: "Добавлены новые клиенты из интернет-магазина",
        entityId: "c1",
        route: "/erp/sales/customers?open=c1",
        type: "customer",
        createdAt: `${anchor}T08:50:00Z`,
      },
    ],
  });
}
