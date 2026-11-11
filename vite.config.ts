import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { erpDemoSession } from "./scripts/erp-demo-session";
import { salesTelegramPilot } from "./scripts/sales-telegram-pilot";

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  if (command === "serve") {
    const env = loadEnv(mode, process.cwd(), "ERP_");
    const session = erpDemoSession(env.ERP_DEMO_PASSWORD_SHA256);
    plugins.push(
      session.plugin,
      salesTelegramPilot({
        token: env.ERP_SALES_TELEGRAM_TOKEN,
        chatId: env.ERP_SALES_TELEGRAM_CHAT_ID,
        threadId: env.ERP_SALES_TELEGRAM_THREAD_ID,
        authenticated: session.authenticated,
        isLocalPost: session.isLocalPost,
      }),
    );
  }
  return {
    base: "./",
    plugins,
    server: { port: 5173, strictPort: true },
    build: { chunkSizeWarningLimit: 700 },
  };
});
