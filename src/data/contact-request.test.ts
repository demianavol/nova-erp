import { describe, expect, it } from "vitest";
import { contactRequestSchema } from "./contact-request";

describe("callback contact validation", () => {
  it.each([
    ["phone", "+86 138 0013 8000"],
    ["phone", "+7 (999) 123-45-67"],
    ["email", "partner@example.com"],
    ["telegram", "@factory_partner"],
    ["telegram", "https://t.me/factory_partner"],
    ["wechat", "factory_2026"],
  ])("accepts a usable %s contact", (method, contact) => {
    expect(
      contactRequestSchema.safeParse({ name: "", method, contact }).success,
    ).toBe(true);
  });
  it.each([
    ["phone", "123"],
    ["phone", "not a phone +8613800138000"],
    ["email", "user@"],
    ["email", ""],
    ["telegram", "two words"],
    ["wechat", " "],
  ])("rejects an invalid %s contact", (method, contact) => {
    expect(
      contactRequestSchema.safeParse({ name: "", method, contact }).success,
    ).toBe(false);
  });
  it("normalizes whitespace without requiring a name", () => {
    const value = contactRequestSchema.parse({
      name: "  ",
      method: "email",
      contact: "  partner@example.com  ",
    });
    expect(value.name).toBe("");
    expect(value.contact).toBe("partner@example.com");
  });
});
