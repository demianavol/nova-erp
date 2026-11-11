import { z } from "zod";

export const salesNotificationLimits = { title: 100, message: 2500 };
export const salesNotificationSchema = z.object({
  title: z.string().trim().max(salesNotificationLimits.title).optional(),
  message: z.string().trim().min(1).max(salesNotificationLimits.message),
});
