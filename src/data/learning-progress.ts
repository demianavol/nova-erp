export const progressKey = "nova-erp-intro-progress";
export const lessonIds = [
  "company",
  "adaptation",
  "communication",
  "process",
  "services",
];

export function readLearningProgress(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(progressKey) ?? "[]",
    );
    return Array.isArray(value)
      ? lessonIds.filter((id) => value.includes(id))
      : [];
  } catch {
    return [];
  }
}
