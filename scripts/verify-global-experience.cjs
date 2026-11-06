/* Browser regression checks for video mattes, layout, controls and atmosphere. */
const { chromium } = require("playwright");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const output = path.resolve(process.env.OUTPUT_DIR || "docs/design/global-experience");
const report = {
  media: "separate supplied dark/light videos with synchronized country mattes",
  layouts: [],
  interactions: [],
  pixels: [],
  playback: {},
  errors: [],
};
const url = process.env.PREVIEW_URL || "http://127.0.0.1:5173/";
fs.mkdirSync(output, { recursive: true });
async function mount(
  browser,
  width = 1440,
  theme = "dark",
  reduced = false,
  fail = false,
) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: reduced ? "reduce" : "no-preference",
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  await context.addInitScript(
    ({ theme }) => {
      localStorage.setItem("yuc-site-theme", theme);
      window.__videoPixels = { draws: 0 };
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const gl = original.call(this, type, ...args);
        if (
          type === "webgl" &&
          this.classList.contains("ge-film-canvas") &&
          gl &&
          !gl.__sampled
        ) {
          gl.__sampled = true;
          const draw = gl.drawArrays.bind(gl),
            canvas = this;
          gl.drawArrays = (...args) => {
            draw(...args);
            const points = [
              [300, 200],
              [750, 300],
              [400, 610],
            ];
            const samples = points.map(([x, y]) => {
              const rgba = new Uint8Array(4);
              gl.readPixels(
                Math.round((x / 896) * canvas.width),
                Math.round((1 - y / 720) * canvas.height),
                1,
                1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rgba,
              );
              return [...rgba];
            });
            let maxEdgeAlpha = 0;
            for (const [x, y, w, h] of [
              [0, 0, canvas.width, 1],
              [0, canvas.height - 1, canvas.width, 1],
              [0, 0, 1, canvas.height],
              [canvas.width - 1, 0, 1, canvas.height],
            ]) {
              const pixels = new Uint8Array(w * h * 4);
              gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
              for (let i = 3; i < pixels.length; i += 4)
                maxEdgeAlpha = Math.max(maxEdgeAlpha, pixels[i]);
            }
            window.__videoPixels = {
              draws: window.__videoPixels.draws + 1,
              samples,
              maxEdgeAlpha,
            };
          };
        }
        return gl;
      };
    },
    { theme },
  );
  if (fail)
    await context.route(/flags-film-(masked-v3|native-light-v3)\.mp4/, (r) =>
      r.abort(),
    );
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !(fail && m.text().includes("ERR_FAILED")))
      report.errors.push(m.text());
  });
  const requests = [];
  page.on("request", (r) => {
    if (/flags-film-(masked-v3|native-light-v3)\.mp4/.test(r.url()))
      requests.push(r.url());
  });
  await page.goto(url);
  const section = page.locator("#global-experience");
  await section.waitFor();
  assert.equal(requests.length, 0, "Lazy media before approach");
  await page.evaluate(async () => {
    await document.fonts.ready;
    const s = document.querySelector("#global-experience");
    scrollTo({
      top: scrollY + s.getBoundingClientRect().top - 100,
      behavior: "instant",
    });
  });
  if (!reduced && !fail)
    await page.waitForFunction(
      () =>
        document.querySelector(".ge-film").dataset.ready === "true" &&
        window.__videoPixels.draws > 1,
    );
  await page.waitForTimeout(1500);
  return { page, context, section, requests };
}
const brightness = (p) => p.slice(0, 3).reduce((a, b) => a + b, 0);
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
  try {
    for (const width of [1440, 1024, 768, 390, 320])
      for (const theme of ["dark", "light"]) {
        const { page, context, section } = await mount(browser, width, theme);
        const metrics = await section.evaluate((s) => {
          const rect = (c) =>
            s.querySelector(c).getBoundingClientRect().toJSON();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            stage: rect(".ge-stage"),
            picture: rect(".ge-film-picture"),
            buttons: [...s.querySelectorAll("button")].map((e) =>
              e.getBoundingClientRect().toJSON(),
            ),
            bubbleCount: s.querySelectorAll(".ge-bubble-position").length,
            source: s.querySelector("video").getAttribute("src"),
          };
        });
        assert.equal(metrics.overflow, false);
        assert.equal(
          metrics.buttons.length,
          3,
          "Only country controls, no pause button",
        );
        assert.equal(metrics.bubbleCount, 8);
        assert(
          metrics.source.includes(
            theme === "light"
              ? "flags-film-native-light-v3.mp4"
              : "flags-film-masked-v3.mp4",
          ),
        );
        assert.equal(
          await section.locator(".ge-copy .ge-typewriter").count(),
          0,
          "Only country copy uses typewriter",
        );
        metrics.buttons.forEach((r) =>
          assert(r.height >= 44 && r.x >= 0 && r.right <= width),
        );
        report.layouts.push({ width, theme, ...metrics });
        if (width === 1440) {
          await section.locator("video").evaluate((v) => {
            v.pause();
            v.currentTime = 4;
          });
          await page.waitForFunction(() => {
            const v = document.querySelector(".ge-film-source");
            return !v.seeking && Math.abs(v.currentTime - 4) < 0.02;
          });
          await page.waitForTimeout(150);
          await page.screenshot({
            path: path.join(output, `uzbekistan-corner-${theme}.png`),
          });
          await section.locator("video").evaluate((v) => {
            v.pause();
            v.currentTime = 0.9;
          });
          await page.waitForFunction(() => {
            const v = document.querySelector(".ge-film-source");
            return !v.seeking && Math.abs(v.currentTime - 0.9) < 0.02;
          });
          await page.waitForTimeout(150);
        }
        const baseline = await page.evaluate(
          () => window.__videoPixels.samples,
        );
        await page.screenshot({
          path: path.join(output, `${theme}-${width}.png`),
        });
        for (const [index, id, name] of [
          [0, "cn", "Китай"],
          [1, "kg", "Кыргызстан"],
          [2, "uz", "Узбекистан"],
        ]) {
          const control = section.getByRole("button", { name, exact: true });
          if (width < 768) await control.tap();
          else {
            await control.click();
            await page.mouse.move(0, 0);
          }
          if (width === 1440 && index === 0) {
            const writer = section.locator(".ge-panel .ge-typewriter");
            await page.waitForFunction(() => {
              const w = document.querySelector(".ge-panel .ge-typewriter");
              const length =
                w.querySelector(".ge-typewriter-ink").textContent.length;
              return length > 0 && w.dataset.complete !== "true";
            });
            const initial = await writer.boundingBox();
            await page.waitForFunction(
              () =>
                document.querySelector(".ge-panel .ge-typewriter").dataset
                  .complete === "true",
            );
            const final = await writer.boundingBox();
            assert(
              Math.abs(initial.height - final.height) < 0.1,
              "Panel text reserves its complete height",
            );
            report.playback[`${theme}PanelTypewriter`] = true;
          }
          await page.waitForTimeout(850);
          assert.equal(await control.getAttribute("aria-pressed"), "true");
          assert.equal(await section.locator(".ge-panel h3").innerText(), name);
          const picture = await section
            .locator(".ge-film-picture")
            .boundingBox();
          assert(
            Math.abs(picture.x - metrics.picture.x) < 0.1 &&
              Math.abs(picture.y - metrics.picture.y) < 0.1,
            "Video position never jumps",
          );
          const bounds = await section
            .locator(".ge-country")
            .evaluateAll((nodes) =>
              nodes.map((e) => e.getBoundingClientRect().toJSON()),
            );
          bounds.forEach((r, i) => {
            assert(
              Math.abs(r.y - metrics.buttons[i].y) < 0.1 &&
                Math.abs(r.x - metrics.buttons[i].x) < 0.1,
              "Selectors stay stationary",
            );
          });
          if (width === 1440) {
            // Compare matching source pixels. A selection alone must not draw
            // on the paused decoder, so explicitly decode the reference frame.
            await section.locator("video").evaluate(async (v) => {
              for (const time of [1, 0.9]) {
                const frame = new Promise((resolve) => {
                  v.addEventListener("seeked", resolve, { once: true });
                });
                v.currentTime = time;
                await frame;
              }
            });
          }
          const stats = await page.evaluate(() => window.__videoPixels);
          assert(
            stats.maxEdgeAlpha <= 3,
            `No rectangle edge: alpha ${stats.maxEdgeAlpha}`,
          );
          if (width === 1440) {
            const ratios = stats.samples.map(
              (p, i) => brightness(p) / brightness(baseline[i]),
            );
            assert(
              ratios[index] > 1.025,
              `${id} selected pixels brighten: ${ratios}`,
            );
            ratios.forEach((ratio, i) => {
              if (i !== index)
                assert(ratio < 0.94, `${id} other flag ${i} dims: ${ratios}`);
            });
            report.pixels.push({
              theme,
              country: id,
              ratios,
              edgeAlpha: stats.maxEdgeAlpha,
            });
            if (theme === "dark")
              await page.screenshot({
                path: path.join(output, `selected-${id}.png`),
              });
          }
          report.interactions.push({ width, theme, country: id, passed: true });
        }
        await section
          .getByRole("button", { name: "Узбекистан", exact: true })
          .click();
        assert.equal(await section.getAttribute("data-country"), "all");
        if (width === 1440) {
          const first = section.getByRole("button", {
            name: "Китай",
            exact: true,
          });
          await first.focus();
          await page.keyboard.press("ArrowRight");
          assert.equal(await section.getAttribute("data-country"), "kg");
          await page.keyboard.press("End");
          assert.equal(await section.getAttribute("data-country"), "uz");
          await page.keyboard.press("Escape");
          assert.equal(await section.getAttribute("data-country"), "all");
          await section.locator("video").evaluate((v) => v.play());
          await page.waitForFunction(
            () => !document.querySelector(".ge-film-source").paused,
          );
          const source = await section.locator("video").getAttribute("src");
          const before = await section
            .locator("video")
            .evaluate((v) => v.currentTime);
          await page
            .getByRole("button", {
              name:
                theme === "dark"
                  ? "Включить светлую тему"
                  : "Включить тёмную тему",
              exact: true,
            })
            .click();
          await page.waitForFunction((oldSource) => {
            const video = document.querySelector(".ge-film-source");
            return (
              video.getAttribute("src") !== oldSource &&
              video.readyState >= 2 &&
              !video.seeking &&
              !video.paused &&
              document.querySelector(".ge-film").dataset.ready === "true"
            );
          }, source);
          assert(
            (await section.locator("video").evaluate((v) => v.currentTime)) >=
              before - 0.35,
            "Theme source keeps the playhead",
          );
          report.playback[`${theme}ThemeSourceAndPlayhead`] = true;
          if (theme === "dark") {
            const bubble = section.locator(".ge-bubble-position").first();
            await page.mouse.move(0, 0);
            const idleBefore = await section
              .locator(".ge-bubble-glass")
              .evaluateAll((nodes) =>
                nodes.map((e) => {
                  const r = e.getBoundingClientRect();
                  return [r.x, r.y];
                }),
              );
            await page.waitForTimeout(1400);
            const idleAfter = await section
              .locator(".ge-bubble-glass")
              .evaluateAll((nodes) =>
                nodes.map((e) => {
                  const r = e.getBoundingClientRect();
                  return [r.x, r.y];
                }),
              );
            const autonomous = idleAfter.map((p, i) =>
              Math.hypot(p[0] - idleBefore[i][0], p[1] - idleBefore[i][1]),
            );
            assert(
              Math.max(...autonomous) > 3 &&
                autonomous.filter((d) => d > 0.5).length >= 6,
              "Bubbles visibly drift without pointer input",
            );
            report.playback.bubbleAutonomousDisplacement = autonomous;
            const r = await bubble.locator(".ge-bubble-glass").boundingBox();
            const sampling = page.evaluate(
              () =>
                new Promise((resolve) => {
                  const values = [];
                  const start = performance.now();
                  const step = (t) => {
                    const raw = document.querySelector(".ge-bubble-position")
                      .style.translate;
                    const p = raw.match(/-?[\d.]+/g)?.map(Number) || [0, 0];
                    // CSSOM omits a zero second translate component.
                    values.push([p[0] || 0, p[1] || 0]);
                    if (t - start < 1400) requestAnimationFrame(step);
                    else resolve(values);
                  };
                  requestAnimationFrame(step);
                }),
            );
            await page.mouse.move(r.x + r.width / 2 - 90, r.y + r.height / 2);
            await page.waitForTimeout(450);
            await page.mouse.move(r.x + r.width / 2 + 90, r.y + r.height / 2);
            const hoverSamples = await sampling;
            const maxHover = Math.max(
              ...hoverSamples.map((p) => Math.hypot(...p)),
            );
            const maxStep = Math.max(
              ...hoverSamples
                .slice(1)
                .map((p, i) =>
                  Math.hypot(
                    p[0] - hoverSamples[i][0],
                    p[1] - hoverSamples[i][1],
                  ),
                ),
            );
            assert(
              maxHover > 7 && maxHover <= 13,
              "Hover is noticeably responsive",
            );
            report.playback.bubbleHover = {
              maxDisplacement: maxHover,
              maxFrameStep: maxStep,
            };
            assert(
              maxStep < 1.8,
              `Crossing the bubble stays smooth: ${maxStep}px per frame`,
            );
            await page.mouse.move(0, 0);
            await page.waitForTimeout(1600);
            const returned = await bubble.evaluate((e) =>
              (e.style.translate.match(/-?[\d.]+/g) || []).map(Number),
            );
            assert(
              Math.hypot(...returned) < 0.15,
              "Bubble gently returns after pointer leaves",
            );
            const current = await bubble
              .locator(".ge-bubble-glass")
              .boundingBox();
            await page.mouse.click(
              current.x + current.width / 2,
              current.y + current.height / 2,
            );
            assert(
              await bubble
                .locator(".ge-bubble-glass")
                .evaluate((e) =>
                  e.getAnimations().some((a) => a.playState === "running"),
                ),
              "Bubble pop animation starts on click",
            );
            await page.waitForTimeout(600);
            assert(
              Number(
                await bubble
                  .locator(".ge-bubble-glass")
                  .evaluate((e) => getComputedStyle(e).opacity),
              ) < 0.03,
              "Popped bubble disappears",
            );
            await page.waitForTimeout(1200);
            assert.equal(await bubble.getAttribute("data-popping"), null);
            assert(
              Number(
                await bubble
                  .locator(".ge-bubble-glass")
                  .evaluate((e) => getComputedStyle(e).opacity),
              ) >= 0.7,
              "Bubble respawns and is visible on light",
            );
            report.playback.bubblePopAndRespawn = true;
            await section
              .locator("video")
              .evaluate((v) => (v.currentTime = v.duration - 0.2));
            await page.waitForFunction(
              () => document.querySelector(".ge-film-source").currentTime < 1,
            );
            report.playback.loop = true;
            await page.evaluate(() =>
              scrollTo({ top: 0, behavior: "instant" }),
            );
            await page.waitForFunction(
              () => document.querySelector(".ge-film-source").paused,
            );
            const paused = await page.evaluate(
              () => window.__videoPixels.draws,
            );
            await page.waitForTimeout(300);
            assert.equal(
              await page.evaluate(() => window.__videoPixels.draws),
              paused,
            );
            report.playback.offscreenPaused = true;
            assert(
              await section
                .locator(".ge-bubble-drift,.ge-bubble-sway")
                .evaluateAll((nodes) =>
                  nodes.every(
                    (e) => getComputedStyle(e).animationPlayState === "paused",
                  ),
                ),
              "Autonomous bubbles pause offscreen",
            );
          }
        }
        await context.close();
        console.log(`Verified ${theme} ${width}px`);
      }
    for (const theme of ["dark", "light"]) {
      const { page, context, section, requests } = await mount(
        browser,
        1440,
        theme,
        true,
      );
      assert.equal(await section.locator("video").count(), 0);
      assert.equal(requests.length, 0);
      assert.equal(await section.locator(".ge-typewriter-caret").count(), 0);
      assert(
        await section
          .locator(".ge-film-poster")
          .evaluate((i) => i.complete && i.naturalWidth > 0),
      );
      await section.getByRole("button", { name: "Китай", exact: true }).click();
      assert.equal(await section.locator(".ge-panel h3").innerText(), "Китай");
      assert.equal(
        await section
          .locator(".ge-panel .ge-typewriter")
          .getAttribute("data-complete"),
        "true",
      );
      assert.equal(await section.locator(".ge-typewriter-caret").count(), 0);
      await page.screenshot({
        path: path.join(output, `${theme}-reduced-motion.png`),
      });
      report.playback[`${theme}ReducedMotion`] = true;
      assert(
        await section
          .locator(".ge-bubble-drift,.ge-bubble-sway")
          .evaluateAll((nodes) =>
            nodes.every((e) => getComputedStyle(e).animationName === "none"),
          ),
        "Reduced motion disables autonomous bubbles",
      );
      await context.close();
    }
    for (const failureTheme of ["dark", "light"]) {
      const { page, context, section } = await mount(
        browser,
        1440,
        failureTheme,
        false,
        true,
      );
      await page.waitForFunction(
        () => !document.querySelector(".ge-film-source"),
      );
      assert(
        await section
          .locator(".ge-film-poster")
          .evaluate((i) => i.complete && i.naturalWidth > 0),
      );
      await section
        .getByRole("button", { name: "Кыргызстан", exact: true })
        .click();
      assert.equal(
        await section.locator(".ge-panel h3").innerText(),
        "Кыргызстан",
      );
      await page.screenshot({
        path: path.join(output, `${failureTheme}-video-fallback.png`),
      });
      report.playback[`${failureTheme}PosterFallback`] = true;
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    report.passed = true;
    console.log(
      JSON.stringify(
        {
          passed: true,
          layouts: report.layouts.length,
          selections: report.interactions.length,
          pixels: report.pixels,
          playback: report.playback,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    report.failure = e.stack;
    throw e;
  } finally {
    fs.writeFileSync(
      path.join(output, "browser-report.json"),
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
