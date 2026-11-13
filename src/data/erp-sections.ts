import { matchPath } from "react-router-dom";
import { departmentNames } from "./schema";

export type ErpPage = {
  label: string;
  to: string;
  ready: boolean;
};

function page(label: string, to: string, ready = false): ErpPage {
  return { label, to, ready };
}

export const erpSections = {
  home: page("Главная", "/erp", true),
  firstSteps: page("С чего начать", "/erp/learning/start"),
  learning: page("Учебный маршрут", "/erp/learning"),
  handbook: page("Справочник сотрудника", "/erp/employees"),
  sales: page(departmentNames.sales, "/erp/sales"),
  marketing: page(departmentNames.marketing, "/erp/departments/marketing"),
  purchasing: page(departmentNames.purchasing, "/erp/departments/purchasing"),
  warehouse: page(departmentNames.warehouse, "/erp/departments/warehouse"),
  finance: page(departmentNames.finance, "/erp/departments/finance"),
  team: page("Сотрудники", "/erp/departments/team"),
  departmentDirectory: page("Направления и отделы", "/erp/departments"),
  orgStructure: page("Оргструктура", "/erp/org-structure"),
  profile: page("Личный кабинет", "/erp/profile"),
  documents: page("Документы", "/erp/documents"),
  tasks: page("Задачи", "/erp/tasks"),
  projects: page("Проекты", "/erp/tasks/projects"),
  settings: page("Настройки", "/erp/settings"),
  access: page("Доступы", "/erp/access", true),
};

export const erpAssistantAvailable = false;

export const salesPages = {
  orders: page("Заказы", "/erp/sales/orders", erpSections.sales.ready),
  customers: page("Клиенты", "/erp/sales/customers", erpSections.sales.ready),
  pipeline: page("Воронка", "/erp/sales/pipeline", erpSections.sales.ready),
  analytics: page("Аналитика", "/erp/sales/analytics", erpSections.sales.ready),
  notifications: page(
    "Уведомления",
    "/erp/sales/notifications",
    erpSections.sales.ready,
  ),
};

const pages = [...Object.values(erpSections), ...Object.values(salesPages)];

export function erpPage(pathname: string) {
  if (matchPath("/erp/learning/lesson/:lessonId", pathname)) {
    return erpSections.learning;
  }
  return pages.find(({ to }) => matchPath(to, pathname));
}
