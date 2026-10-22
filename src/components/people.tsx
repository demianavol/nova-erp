import {
  Building2,
  Megaphone,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { departmentNames, type Employee } from "../data/schema";
import { Avatar } from "./ui";
export const departmentVisuals = {
  sales: { icon: ShoppingBag, color: "violet" },
  marketing: { icon: Megaphone, color: "orange" },
  purchasing: { icon: Truck, color: "green" },
  warehouse: { icon: Package, color: "blue" },
  finance: { icon: Wallet, color: "pink" },
  team: { icon: Users, color: "violet" },
};
export function DepartmentBadge({ department }: { department: string }) {
  const visual = departmentVisuals[
    department as keyof typeof departmentVisuals
  ] || { icon: Building2, color: "violet" };
  return (
    <span className={`department-badge department-${visual.color}`}>
      <visual.icon size={11} />
      {departmentNames[department] || department}
    </span>
  );
}
export function EmployeeChip({
  employee,
  compact = false,
}: {
  employee: Employee;
  compact?: boolean;
}) {
  return (
    <span
      className={`employee-chip${compact ? " employee-chip-compact" : ""}`}
      title={`${employee.name} · ${employee.role}`}
    >
      <Avatar name={employee.name} color={employee.color} size="sm" />
      <span>{compact ? employee.name.split(" ")[0] : employee.name}</span>
    </span>
  );
}
