import { z } from "zod";

const required = z.string().trim().min(1);

export const orgMemberUpdateSchema = z.object({
  position: required.max(150),
  departmentId: required,
  managerId: required.nullable(),
  temporaryDepartmentIds: z.array(required),
});

export const orgMemberInputSchema = orgMemberUpdateSchema
  .omit({ temporaryDepartmentIds: true })
  .extend({ name: required.max(100) });

const orgPersonSchema = z.object({
  id: required,
  name: required,
  position: required,
  departmentId: required.nullable(),
  managerId: required.nullable(),
  temporaryDepartmentIds: z.array(required).optional(),
  hasPhoto: z.boolean().optional(),
});

export const orgArchiveSchema = z.array(
  z.object({
    token: z.uuid(),
    person: orgPersonSchema,
    reportIds: z.array(required),
    index: z.number().int().nonnegative(),
    deletedAt: z.iso.datetime(),
  }),
);

export const orgRosterSchema = z
  .object({
    asOf: z.iso.date(),
    directorId: required,
    departments: z.array(z.object({ id: required, name: required })).min(1),
    people: z.array(orgPersonSchema),
    openVacancies: z.number().int().nonnegative(),
  })
  .refine(({ directorId, departments, people }) => {
    const departmentIds = new Set(departments.map(({ id }) => id));
    const peopleIds = new Set(people.map(({ id }) => id));
    return (
      departmentIds.size === departments.length &&
      peopleIds.size === people.length &&
      peopleIds.has(directorId) &&
      people.every(
        (person) =>
          (person.id === directorId
            ? person.departmentId === null && person.managerId === null
            : person.departmentId !== null &&
              departmentIds.has(person.departmentId)) &&
          (person.managerId === null ||
            (person.managerId !== person.id &&
              peopleIds.has(person.managerId))) &&
          (!person.temporaryDepartmentIds?.length ||
            (person.id !== directorId &&
              new Set(person.temporaryDepartmentIds).size ===
                person.temporaryDepartmentIds.length &&
              person.temporaryDepartmentIds.every(
                (id) => id !== person.departmentId && departmentIds.has(id),
              ))),
      )
    );
  }, "Некорректные связи в составе команды");

export type OrgRoster = z.infer<typeof orgRosterSchema>;
export type OrgArchive = z.infer<typeof orgArchiveSchema>;
export type OrgMemberInput = z.infer<typeof orgMemberInputSchema>;
export type OrgMemberUpdate = z.infer<typeof orgMemberUpdateSchema>;

export function availableOrgManagers(
  people: OrgRoster["people"],
  personId: string,
) {
  const managerById = new Map(
    people.map(({ id, managerId }) => [id, managerId]),
  );
  return people.filter(({ id }) => {
    const visited = new Set([personId]);
    for (
      let current: string | null = id;
      current;
      current = managerById.get(current) ?? null
    ) {
      if (visited.has(current)) return false;
      visited.add(current);
    }
    return true;
  });
}
