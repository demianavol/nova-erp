import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import {
  availableOrgManagers,
  orgArchiveSchema,
  orgMemberInputSchema,
  orgMemberUpdateSchema,
  orgRosterSchema,
  type OrgArchive,
  type OrgRoster,
} from "../src/data/erp-org";
import { today } from "../src/lib/utils";
import type { erpDemoSession } from "./erp-demo-session";

const photosDirectory = ".erp-org-photos.local";
const photoIdPattern = /^[a-zA-Z0-9_-]+$/;
const maxPhotoBytes = 512 * 1024;

function sameDepartmentMember(
  people: OrgRoster["people"],
  member: OrgRoster["people"][number],
) {
  const normalize = (name: string) =>
    name
      .trim()
      .toLocaleLowerCase("ru")
      .replaceAll("ё", "е")
      .replace(/\s+/g, " ");
  return people.some(
    ({ id, name, departmentId }) =>
      id !== member.id &&
      departmentId === member.departmentId &&
      normalize(name) === normalize(member.name),
  );
}

async function writeAtomically(path: string, data: string | Buffer) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, data, { flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export function erpOrgRoster({
  authenticated,
  isLocalPost,
}: Pick<
  ReturnType<typeof erpDemoSession>,
  "authenticated" | "isLocalPost"
>): Plugin {
  return {
    name: "erp-org-roster",
    apply: "serve",
    config: () => ({
      server: {
        fs: {
          deny: [
            ".env",
            ".env.*",
            "*.{crt,pem}",
            "**/.git/**",
            `**/${photosDirectory}/**`,
          ],
        },
      },
    }),
    configureServer(server) {
      const rosterPath = resolve(server.config.root, ".env.erp-team.local");
      const photosPath = resolve(server.config.root, photosDirectory);
      const readRoster = async () => {
        const data = JSON.parse(
          (await readFile(rosterPath, "utf-8")).replace(/^\uFEFF/, ""),
        );
        return {
          roster: orgRosterSchema.parse(data),
          archive: orgArchiveSchema.parse(
            data.archive === undefined ? [] : data.archive,
          ),
        };
      };
      const saveRoster = (roster: OrgRoster, archive: OrgArchive) =>
        writeAtomically(
          rosterPath,
          JSON.stringify({ ...roster, archive }, null, 2) + "\n",
        );
      const rosterWithPhotos = async (
        roster: OrgRoster,
      ): Promise<OrgRoster> => {
        const files = new Set(
          await readdir(photosPath).catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return [];
            throw error;
          }),
        );
        return {
          ...roster,
          people: roster.people.map((person) => ({
            ...person,
            hasPhoto:
              photoIdPattern.test(person.id) && files.has(`${person.id}.webp`),
          })),
        };
      };
      let writes: Promise<unknown> = Promise.resolve();

      server.middlewares.use("/api/erp/org-roster", async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (!authenticated(req)) {
          res.writeHead(401).end();
          return;
        }
        const pathname = (req.url ?? "/").split("?")[0];
        const photo = /^\/photos\/([a-zA-Z0-9_-]+)\.webp$/.exec(pathname);
        const member = /^\/people\/([^/]+)$/.exec(pathname);
        const restore = /^\/restore\/([a-f0-9-]{36})$/.exec(pathname);
        const archiveRequest = pathname === "/archive";
        if (
          !photo &&
          !member &&
          !restore &&
          !archiveRequest &&
          pathname !== "/"
        ) {
          res.writeHead(404).end();
          return;
        }
        const allow = restore
          ? ["POST"]
          : archiveRequest
            ? ["GET"]
            : member
              ? ["PATCH", "DELETE"]
              : ["GET", "POST"];
        if (!allow.includes(req.method ?? "")) {
          res.writeHead(405, { Allow: allow.join(", ") }).end();
          return;
        }
        if (req.method !== "GET" && !isLocalPost(req)) {
          res.writeHead(403).end();
          return;
        }
        try {
          if (photo) {
            const id = photo[1];
            const path = resolve(photosPath, `${id}.webp`);
            const { roster } = await readRoster();
            if (!roster.people.some((person) => person.id === id)) {
              res.writeHead(404).end();
              return;
            }
            if (req.method === "GET") {
              const image = await readFile(path);
              res
                .writeHead(200, {
                  "Content-Type": "image/webp",
                  "X-Content-Type-Options": "nosniff",
                })
                .end(image);
              return;
            }
            if (req.headers["content-type"] !== "image/webp") {
              res.writeHead(415).end();
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req as AsyncIterable<Buffer>) {
              size += chunk.length;
              if (size > maxPhotoBytes) {
                res.writeHead(413).end();
                return;
              }
              chunks.push(chunk);
            }
            const image = Buffer.concat(chunks, size);
            if (
              image.length < 20 ||
              image.toString("ascii", 0, 4) !== "RIFF" ||
              image.readUInt32LE(4) !== image.length - 8 ||
              image.toString("ascii", 8, 12) !== "WEBP" ||
              !["VP8 ", "VP8L", "VP8X"].includes(
                image.toString("ascii", 12, 16),
              )
            ) {
              res.writeHead(400).end();
              return;
            }
            await mkdir(photosPath, { recursive: true });
            await writeAtomically(path, image);
            res.writeHead(204).end();
            return;
          }
          if (req.method === "GET") {
            const { roster, archive } = await readRoster();
            const data = archiveRequest
              ? archive.slice().reverse()
              : await rosterWithPhotos(roster);
            res
              .writeHead(200, {
                "Content-Type": "application/json; charset=utf-8",
              })
              .end(JSON.stringify(data));
            return;
          }
          const deleting = req.method === "DELETE";
          let input;
          if (!deleting && !restore) {
            let body = "";
            req.setEncoding("utf8");
            for await (const chunk of req) {
              body += chunk;
              if (body.length > 4096) {
                res.writeHead(413).end();
                return;
              }
            }
            const parsed = JSON.parse(body || "null");
            input = member
              ? orgMemberUpdateSchema.safeParse(parsed)
              : orgMemberInputSchema.safeParse(parsed);
            if (!input.success) {
              res.writeHead(400).end();
              return;
            }
          }
          const changes = input?.data;
          const memberId = member && decodeURIComponent(member[1]);
          const save = writes.then(async () => {
            const { roster, archive } = await readRoster();
            if (restore) {
              const entry = archive.find(({ token }) => token === restore[1]);
              if (!entry) return { status: 410 };
              if (
                sameDepartmentMember(roster.people, entry.person) ||
                roster.people.some(({ id }) => id === entry.person.id)
              )
                return { status: 409 };

              const person = { ...entry.person };
              if (!roster.people.some(({ id }) => id === person.managerId))
                person.managerId = null;
              const people = [...roster.people];
              people.splice(entry.index, 0, person);
              for (const [index, report] of people.entries()) {
                if (
                  entry.reportIds.includes(report.id) &&
                  report.managerId === null &&
                  availableOrgManagers(people, report.id).some(
                    ({ id }) => id === person.id,
                  )
                ) {
                  people[index] = { ...report, managerId: person.id };
                }
              }
              const restored = orgRosterSchema.safeParse({
                ...roster,
                asOf: today(),
                people,
              });
              if (!restored.success) return { status: 409 };
              const result = await rosterWithPhotos(restored.data);
              await saveRoster(
                restored.data,
                archive.filter((item) => item !== entry),
              );
              return { status: 200, roster: result };
            }
            const current = memberId
              ? roster.people.find(({ id }) => id === memberId)
              : undefined;
            if (
              memberId === roster.directorId ||
              (memberId && !current && !deleting)
            )
              return { status: 404 };
            if (deleting && !current) {
              return {
                status: 200,
                roster: await rosterWithPhotos(roster),
                undoToken: archive.find(({ person }) => person.id === memberId)
                  ?.token,
              };
            }
            let people: OrgRoster["people"];
            if (!changes) {
              people = roster.people
                .filter(({ id }) => id !== memberId)
                .map((person) =>
                  person.managerId === memberId
                    ? { ...person, managerId: null }
                    : person,
                );
            } else {
              const updatedPerson =
                "name" in changes
                  ? { id: randomUUID(), ...changes }
                  : { ...current!, ...changes };
              if (
                current &&
                updatedPerson.managerId &&
                updatedPerson.managerId !== current.managerId &&
                !availableOrgManagers(roster.people, current.id).some(
                  ({ id }) => id === updatedPerson.managerId,
                )
              )
                return { status: 400 };
              if (sameDepartmentMember(roster.people, updatedPerson))
                return { status: 409 };
              people = current
                ? roster.people.map((person) =>
                    person.id === current.id ? updatedPerson : person,
                  )
                : [...roster.people, updatedPerson];
            }

            const updated = orgRosterSchema.safeParse({
              ...roster,
              asOf: today(),
              people,
            });
            if (!updated.success) return { status: 400 };
            const result = await rosterWithPhotos(updated.data);
            if (deleting && current) {
              const token = randomUUID();
              const archivedManager = archive.find(({ reportIds }) =>
                reportIds.includes(current.id),
              );
              await saveRoster(updated.data, [
                ...archive,
                {
                  token,
                  person: {
                    ...current,
                    managerId:
                      current.managerId ?? archivedManager?.person.id ?? null,
                  },
                  reportIds: [
                    ...roster.people,
                    ...archive.map(({ person }) => person),
                  ]
                    .filter(({ managerId }) => managerId === current.id)
                    .map(({ id }) => id),
                  index: roster.people.indexOf(current),
                  deletedAt: new Date().toISOString(),
                },
              ]);
              return { status: 200, roster: result, undoToken: token };
            }
            const updatedMember =
              current && people.find(({ id }) => id === current.id);
            const updatedArchive =
              current &&
              updatedMember &&
              updatedMember.managerId !== current.managerId
                ? archive.map((entry) => ({
                    ...entry,
                    reportIds: entry.reportIds.filter(
                      (id) => id !== current.id,
                    ),
                  }))
                : archive;
            await saveRoster(updated.data, updatedArchive);
            return { status: current ? 200 : 201, roster: result };
          });
          writes = save.catch(() => {});
          const result = await save;
          if (result.roster)
            res.setHeader("Content-Type", "application/json; charset=utf-8");
          if (result.undoToken)
            res.setHeader("X-Org-Undo-Token", result.undoToken);
          res
            .writeHead(result.status)
            .end(result.roster ? JSON.stringify(result.roster) : undefined);
        } catch (error) {
          const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
          res
            .writeHead(
              missing
                ? 404
                : (error instanceof SyntaxError || error instanceof URIError) &&
                    req.method !== "GET"
                  ? 400
                  : 500,
            )
            .end();
        }
      });
    },
  };
}
