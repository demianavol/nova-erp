import { create } from "zustand";

export const useAuth = create<{
  authenticated: boolean | null;
  check: () => Promise<void>;
  login: (password: string, remember: boolean) => Promise<number>;
  logout: () => Promise<boolean>;
}>((set) => ({
  authenticated: import.meta.env.DEV ? null : false,
  async check() {
    try {
      const response = await fetch("/api/erp/session", { cache: "no-store" });
      set({ authenticated: response.status === 204 });
    } catch {
      set({ authenticated: false });
    }
  },
  async login(password, remember) {
    try {
      const response = await fetch("/api/erp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, remember }),
      });
      if (response.status === 204) set({ authenticated: true });
      return response.status;
    } catch {
      return 503;
    }
  },
  async logout() {
    try {
      const response = await fetch("/api/erp/session", { method: "DELETE" });
      if (response.status === 204) {
        set({ authenticated: false });
        return true;
      }
    } catch {
      /* Report the failure and let the user try again. */
    }
    return false;
  },
}));
