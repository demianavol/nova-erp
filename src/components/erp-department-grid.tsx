import { Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import { accessDepartments } from "../data/access-board";
import { company } from "../data/company";
import { erpSections } from "../data/erp-sections";
import { OnboardingEmoji } from "./onboarding-emoji";
import "./erp-department-grid.css";

type DepartmentCard = {
  id: string;
  title: string;
  description?: string;
  to: string;
  directoryOnly?: boolean;
};

const departmentPages = new Map(
  accessDepartments.map(({ to, label }) => [
    to.slice(to.lastIndexOf("/") + 1),
    { to, label },
  ]),
);

export const departmentAnchor = (id: string) => `department-${id}`;

const departments: DepartmentCard[] = company.departments.map((department) => ({
  ...department,
  directoryOnly: department.id === "product" || department.id === "content",
  to:
    departmentPages.get(department.id)?.to ??
    `${erpSections.orgStructure.to}#${departmentAnchor(department.id)}`,
}));

for (const [id, { label, to }] of departmentPages) {
  if (departments.some((department) => department.id === id)) continue;
  departments.push({ id, title: label, to });
}

const departmentIcons = [
  "product",
  "sales",
  "marketing",
  "content",
  "finance",
  "it",
  "hr",
  "purchasing",
  "warehouse",
] as const;

export const departmentIcon = (id: string) =>
  departmentIcons.find((asset) => asset === id);

export function ErpDepartmentGrid({
  detailed = false,
}: {
  detailed?: boolean;
}) {
  return (
    <ul className="erp-department-grid" data-detailed={detailed}>
      {departments.map(({ id, title, description, to, directoryOnly }) => {
        const icon = departmentIcon(id);
        const content = (
          <>
            {icon ? (
              <OnboardingEmoji asset={icon} />
            ) : (
              <Boxes
                className="erp-department-fallback"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            )}
            <span>
              <strong>{title}</strong>
              {detailed && description && <small>{description}</small>}
            </span>
          </>
        );
        if (detailed && directoryOnly) {
          return (
            <li key={id} id={departmentAnchor(id)} tabIndex={-1}>
              <div className="erp-department-description-card">{content}</div>
            </li>
          );
        }
        return (
          <li key={id}>
            <Link
              to={
                directoryOnly
                  ? `${erpSections.departmentDirectory.to}#${departmentAnchor(id)}`
                  : to
              }
            >
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
