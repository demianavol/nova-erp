import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

export function erpDemoSession(passwordHash?: string) {
  const expected =
    passwordHash && /^[a-f\d]{64}$/i.test(passwordHash)
      ? Buffer.from(passwordHash, "hex")
      : null;
  const sessions = new Map<string, number>();
  let failedAttempts = 0;
  let retryAt = 0;

  function isLocal(req: IncomingMessage) {
    return (
      ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
        req.socket.remoteAddress ?? "",
      ) &&
      /^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(
        req.headers.host ?? "",
      )
    );
  }
  function isLocalPost(req: IncomingMessage) {
    return isLocal(req) && req.headers.origin === `http://${req.headers.host}`;
  }
  const cookieName = (req: IncomingMessage) =>
    `nova_erp_${req.socket.localPort}`;
  const sessionId = (req: IncomingMessage) =>
    req.headers.cookie
      ?.split(/;\s*/)
      .find((cookie) => cookie.startsWith(`${cookieName(req)}=`))
      ?.split("=")[1];
  function authenticated(req: IncomingMessage) {
    return (
      isLocal(req) && (sessions.get(sessionId(req) ?? "") ?? 0) > Date.now()
    );
  }
  function setCookie(
    req: IncomingMessage,
    res: ServerResponse,
    id: string,
    maxAge?: number,
  ) {
    const expiry = maxAge === undefined ? "" : `; Max-Age=${maxAge}`;
    res.setHeader(
      "Set-Cookie",
      `${cookieName(req)}=${id}; Path=/api; HttpOnly; SameSite=Strict${expiry}`,
    );
  }
  const plugin: Plugin = {
    name: "erp-demo-session",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/erp/session", async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (!isLocal(req) || (req.method !== "GET" && !isLocalPost(req))) {
          res.writeHead(403).end();
          return;
        }
        if (req.method === "GET") {
          res.writeHead(authenticated(req) ? 204 : 401).end();
          return;
        }
        if (req.method === "DELETE") {
          sessions.delete(sessionId(req) ?? "");
          setCookie(req, res, "", 0);
          res.writeHead(204).end();
          return;
        }
        if (req.method !== "POST") {
          res.writeHead(405, { Allow: "GET, POST, DELETE" }).end();
          return;
        }
        if (!expected) {
          res.writeHead(503).end();
          return;
        }
        const now = Date.now();
        if (now >= retryAt) {
          failedAttempts = 0;
          retryAt = now + 60_000;
        }
        if (failedAttempts >= 8) {
          res.writeHead(429).end();
          return;
        }
        try {
          let body = "";
          req.setEncoding("utf8");
          for await (const chunk of req) {
            body += chunk;
            if (body.length > 1024) {
              res.writeHead(413).end();
              return;
            }
          }
          const { password, remember } = JSON.parse(body);
          const valid =
            typeof password === "string" &&
            timingSafeEqual(
              expected,
              createHash("sha256").update(password).digest(),
            );
          if (!valid) {
            failedAttempts += 1;
            res.writeHead(401).end();
            return;
          }
          for (const [id, expires] of sessions)
            if (expires <= now) sessions.delete(id);
          sessions.delete(sessionId(req) ?? "");
          const id = randomBytes(32).toString("hex");
          const ttl = remember === true ? 7 * 86400 : 8 * 3600;
          sessions.set(id, now + ttl * 1000);
          setCookie(req, res, id, remember === true ? ttl : undefined);
          res.writeHead(204).end();
        } catch {
          res.writeHead(400).end();
        }
      });
    },
  };
  return { plugin, authenticated, isLocalPost };
}
