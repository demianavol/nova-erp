// Run against the Vite dev server with Playwright available in Node.
// Optionally set YUC_PLAYWRIGHT_MODULE to a local Playwright installation.
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.YUC_PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.YUC_EMBLEM_ORIGIN || "http://127.0.0.1:5188";
const output = new URL("../../public/media/emblems/", import.meta.url);
const kinds = [
  "career-growth",
  "career-impact",
  "career-team",
  "career-projects",
  "career-freedom",
  "career-learning",
];
const args = process.argv.slice(2);
const selected = args.filter((arg) => !arg.startsWith("--"));
const onlyPoster = args.includes("--poster");
for (const kind of selected) {
  if (!kinds.includes(kind)) throw new Error(`Unknown emblem: ${kind}`);
}

const browser = await chromium.launch({
  channel: process.env.YUC_EMBLEM_BROWSER || "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

try {
  await mkdir(output, { recursive: true });
  const page = await browser.newPage();
  await page.route("**/__emblem_studio__", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Emblem studio</title>",
    }),
  );
  await page.goto(new URL("/__emblem_studio__", origin).href);
  await page.evaluate(async () => {
    const { createStudio } = await import("/scripts/emblems/studio.mjs");
    const { careerScene } = await import("/scripts/emblems/careers.mjs");
    globalThis.emblemStudio = createStudio();
    globalThis.careerScene = careerScene;
  });
  for (const kind of selected.length ? selected : kinds) {
    const assets = await page.evaluate(
      ({ kind, onlyPoster }) =>
        globalThis.emblemStudio.bake(kind, globalThis.careerScene, onlyPoster),
      { kind, onlyPoster },
    );
    for (const [name, data] of Object.entries(assets)) {
      if (!data) continue;
      const bytes = Buffer.from(data.split(",")[1], "base64");
      await writeFile(new URL(`${kind}-${name}.webp`, output), bytes);
      console.log(`${kind} ${name}: ${(bytes.length / 1024).toFixed(1)} KiB`);
    }
  }
  await page.evaluate(() => globalThis.emblemStudio.dispose());
} finally {
  await browser.close();
}
