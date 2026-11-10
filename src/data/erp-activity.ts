import { z } from "zod";
import { create } from "zustand";

const storageKey = "nova-erp-page-activity";
const activitySchema = z
  .array(
    z.object({
      path: z.string().startsWith("/erp/"),
      visits: z.number().int().positive(),
    }),
  )
  .max(40);
type Activity = z.infer<typeof activitySchema>;

function readActivity(): Activity | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    const parsed = activitySchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export const useErpActivity = create<{
  activity: Activity;
  record: (path: string) => void;
}>((set, get) => {
  let storageFailed = false;
  return {
    activity: readActivity() ?? [],
    record(path) {
      const previous =
        (storageFailed ? undefined : readActivity()) ?? get().activity;
      const visits =
        (previous.find((item) => item.path === path)?.visits ?? 0) + 1;
      const activity = [
        { path, visits },
        ...previous.filter((item) => item.path !== path),
      ].slice(0, 40);
      set({ activity });
      try {
        localStorage.setItem(storageKey, JSON.stringify(activity));
        storageFailed = false;
      } catch {
        storageFailed = true;
      }
    },
  };
});
