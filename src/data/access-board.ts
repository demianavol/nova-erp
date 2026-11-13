import { create } from "zustand";
import { z } from "zod";
import { erpSections, salesPages, type ErpPage } from "./erp-sections";
import type { Task } from "./schema";

export const accessDepartments = [
  erpSections.sales,
  erpSections.marketing,
  erpSections.purchasing,
  erpSections.warehouse,
  erpSections.finance,
];

const roleSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
});
export const departmentPermissions = {
  view: "Только просмотр",
  edit: "Редактирование",
  approve: "Согласование",
} as const;
const permissionSchema = z.enum(["view", "edit", "approve"]);
export type DepartmentPermission = z.infer<typeof permissionSchema>;
const adminRoleId = "role:admin";
const linkSchema = z.object({
  from: z.string(),
  to: z.string(),
  permission: permissionSchema.optional(),
});
const graphSchema = z.object({
  roles: z.array(roleSchema),
  links: z.array(linkSchema),
});
type Graph = z.infer<typeof graphSchema>;
export type AccessLink = z.infer<typeof linkSchema>;

const storageKey = "nova-erp-access-board-v1";
const initialGraph: Graph = {
  roles: [
    { id: adminRoleId, name: "Администратор" },
    { id: "role:manager", name: "Руководитель отдела" },
    { id: "role:employee", name: "Сотрудник" },
  ],
  links: [],
};

function readGraph(): Graph {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? graphSchema.parse(JSON.parse(raw)) : initialGraph;
  } catch {
    return initialGraph;
  }
}

export const employeeNode = (id: string) => `employee:${id}`;
const sameLink = (a: AccessLink, b: AccessLink) =>
  a.from === b.from && a.to === b.to;

function employeeRoles(graph: Graph, employeeId: string) {
  return new Set(
    graph.links
      .filter(
        ({ from, to }) =>
          from === employeeNode(employeeId) &&
          graph.roles.some(({ id }) => id === to),
      )
      .map(({ to }) => to),
  );
}

export function canManageAccess(graph: Graph, employeeId: string) {
  return employeeRoles(graph, employeeId).has(adminRoleId);
}

export function employeeDepartments(graph: Graph, employeeId: string) {
  const roles = employeeRoles(graph, employeeId);
  const grants = graph.links.filter(({ from }) => roles.has(from));
  return accessDepartments.flatMap((page) => {
    const permissions = grants.filter(({ to }) => to === page.to);
    if (!permissions.length) return [];
    return [
      {
        ...page,
        edit: permissions.some(({ permission }) => permission === "edit"),
        approve: permissions.some(({ permission }) => permission === "approve"),
      },
    ];
  });
}

export function departmentForPage(page: ErpPage) {
  if (Object.values(salesPages).some(({ to }) => to === page.to)) {
    return erpSections.sales;
  }
  return page;
}

export function canUseDepartmentAction(
  {
    graph,
    previewEmployeeId,
  }: { graph: Graph; previewEmployeeId: string | null },
  department: Task["department"],
  action: "edit" | "approve",
) {
  if (!previewEmployeeId) return true;
  return employeeDepartments(graph, previewEmployeeId).some(
    (grant) => grant.to === erpSections[department]?.to && grant[action],
  );
}

export function useDepartmentAction(
  department: Task["department"],
  action: "edit" | "approve",
) {
  return useAccessBoard((state) =>
    canUseDepartmentAction(state, department, action),
  );
}

export function assertDepartmentAction(
  department: Task["department"],
  action: "edit" | "approve",
) {
  if (!canUseDepartmentAction(useAccessBoard.getState(), department, action)) {
    throw new Error("Недостаточно прав для этого действия.");
  }
}

export const useAccessBoard = create<{
  graph: Graph;
  previewEmployeeId: string | null;
  preview: (id: string | null) => void;
  addRole: (name: string) => string;
  connect: (link: Pick<AccessLink, "from" | "to">) => string;
  disconnect: (link: AccessLink) => string;
  setPermission: (link: AccessLink, permission: DepartmentPermission) => string;
}>((set, get) => {
  function mayChange(graph: Graph) {
    const { previewEmployeeId } = get();
    return !previewEmployeeId || canManageAccess(graph, previewEmployeeId);
  }
  function save(graph: Graph, message: string) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(graph));
      set({ graph });
      return message;
    } catch {
      return "Не удалось сохранить изменения в браузере.";
    }
  }

  return {
    graph: readGraph(),
    previewEmployeeId: null,
    preview: (previewEmployeeId) => set({ previewEmployeeId }),
    addRole(name) {
      const graph = readGraph();
      if (!mayChange(graph))
        return "Недостаточно прав для управления доступами.";
      const role = roleSchema.safeParse({
        id: `role:${crypto.randomUUID()}`,
        name,
      });
      if (!role.success) return "Введите название роли длиной до 60 символов.";
      if (
        graph.roles.some(
          ({ name }) =>
            name.toLocaleLowerCase("ru") ===
            role.data.name.toLocaleLowerCase("ru"),
        )
      ) {
        return "Роль с таким названием уже есть.";
      }
      return save(
        { ...graph, roles: [...graph.roles, role.data] },
        "Роль создана.",
      );
    },
    connect({ from, to }) {
      const graph = readGraph();
      if (!mayChange(graph))
        return "Недостаточно прав для управления доступами.";
      const department = accessDepartments.some((page) => page.to === to);
      const link: AccessLink = department
        ? { from, to, permission: "view" }
        : { from, to };
      const isRole = (id: string) => graph.roles.some((role) => role.id === id);
      if (
        !(link.from.startsWith("employee:") && isRole(link.to)) &&
        !(isRole(link.from) && department)
      ) {
        return "Соедините сотрудника с ролью или роль с отделом.";
      }
      if (graph.links.some((item) => sameLink(item, link)))
        return "Такая связь уже есть.";
      return save(
        { ...graph, links: [...graph.links, link] },
        "Связь добавлена.",
      );
    },
    disconnect(link) {
      const graph = readGraph();
      if (!mayChange(graph))
        return "Недостаточно прав для управления доступами.";
      return save(
        {
          ...graph,
          links: graph.links.filter((item) => !sameLink(item, link)),
        },
        "Связь удалена.",
      );
    },
    setPermission(link, permission) {
      const graph = readGraph();
      if (!mayChange(graph))
        return "Недостаточно прав для управления доступами.";
      if (
        !accessDepartments.some(({ to }) => to === link.to) ||
        !graph.roles.some(({ id }) => id === link.from) ||
        !graph.links.some((item) => sameLink(item, link)) ||
        !permissionSchema.safeParse(permission).success
      ) {
        return "Выберите связь роли с отделом.";
      }
      return save(
        {
          ...graph,
          links: graph.links.map((item) =>
            sameLink(item, link) ? { ...item, permission } : item,
          ),
        },
        "Права сохранены.",
      );
    },
  };
});
