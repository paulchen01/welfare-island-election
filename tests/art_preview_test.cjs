const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const assert = require("assert/strict");
const root = path.join(__dirname, "..");
const shot = process.env.ART_SHOTS;
if (shot) fs.mkdirSync(shot, { recursive: true });
const preview = pathToFileURL(path.join(root, "src/art-preview.html")).href;
let browser;
(async () => {
  browser = await chromium.launch({
    ...(process.env.ART_BROWSER_CHANNEL
      ? { channel: process.env.ART_BROWSER_CHANNEL }
      : {}),
    headless: true,
  });
  const errors = [];
  const checks = [];
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  for (const screen of [
    "budget",
    "results",
    "final",
    "news",
    "story",
    "characters",
  ]) {
    await page.goto(preview + "?capture=1&screen=" + screen);
    await page.locator(".phone").waitFor();
    if (shot)
      await page.screenshot({ path: path.join(shot, screen + "-390.png") });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      screen + " overflows",
    );
    assert(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
      "missing image",
    );
    if (screen === "final")
      assert.equal(
        await page.locator("#round-label").innerText(),
        "第五屆 / 五屆",
      );
    if (screen === "budget") {
      const footer = await page.locator("#actionbar").boundingBox();
      const second = await page.locator(".policy").nth(1).boundingBox();
      assert(
        second.y + second.height <= footer.y,
        "second card not fully visible",
      );
      await page.locator("[data-detail=p5]").click();
      assert(await page.locator("#detail-p5").isVisible());
      assert.match(await page.locator("#detail-p5").innerText(), /預期受益者/);
      await page.locator("[data-add=p5]").click();
      assert.equal(
        await page.locator("[data-add=p5]").getAttribute("aria-pressed"),
        "true",
      );
      await page.locator("[data-add=p5]").click();
      assert.equal(
        await page.locator("[data-add=p5]").getAttribute("aria-pressed"),
        "false",
      );
      await page.locator("[data-action=announce]").click();
      assert.match(await page.locator("#notice").innerText(), /未執行/);
    }
    if (screen === "story") {
      const text = await page.locator(".story-block").allTextContents();
      await page.locator("[data-action=play]").click();
      assert(
        await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing")),
      );
      await page.locator("[data-action=skip]").click();
      assert(
        !(await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing"))),
      );
      assert.deepEqual(
        await page.locator(".story-block").allTextContents(),
        text,
      );
      await page.locator("[data-action=play]").click();
      await page.keyboard.press("Escape");
      assert(
        !(await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing"))),
      );
      await page.locator("#reduce-motion").check();
      await page.locator("[data-action=play]").click();
      assert(
        !(await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing"))),
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#reduce-motion").uncheck();
      await page.locator("[data-action=play]").click();
      assert(
        !(await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing"))),
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.locator("[data-action=play]").click();
      await page.waitForTimeout(2600);
      assert(
        !(await page
          .locator("#story-art")
          .evaluate((e) => e.classList.contains("playing"))),
      );
    }
    if (screen === "news") {
      await page.locator("[data-toggle-layer=energy]").check();
      assert(await page.locator("[data-layer=energy]").isVisible());
      assert(await page.locator("[data-marker=energy]").isVisible());
      assert.match(
        await page.locator("[data-legend=energy]").innerText(),
        /能源/,
      );
      await page.locator("#layer-mode").selectOption("preview");
      assert.match(
        await page.locator("#layer-caption").innerText(),
        /尚未實施/,
      );
      for (const box of await page.locator("[data-toggle-layer]").all())
        await box.uncheck();
      assert(await page.locator(".empty-legend").isVisible());
      assert.equal(await page.locator("[data-marker]:visible").count(), 0);
    }
    checks.push(screen + " 390px screenshot + behavior");
  }
  for (const width of [360, 390, 1280])
    for (const screen of [
      "budget",
      "results",
      "final",
      "news",
      "story",
      "characters",
    ]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(preview + "?screen=" + screen);
      await page.addStyleTag({
        content:
          "html{font-size:17.6px} .phone main p,.roles{font-size:17.6px}",
      });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        screen + " overflow at " + width,
      );
      const bad = await page
        .locator("button,summary,select")
        .evaluateAll((els) =>
          els
            .filter(
              (e) =>
                e.getBoundingClientRect().height > 0 &&
                e.getBoundingClientRect().height < 47,
            )
            .map((e) => e.textContent),
        );
      assert.deepEqual(bad, []);
    }
  checks.push("360/390/1280px; enlarged body text; >=48px controls");
  await page.setViewportSize({ width: 780, height: 1000 });
  await page.goto(preview + "?screen=news");
  if (shot) await page.screenshot({ path: path.join(shot, "desktop.png") });
  assert.deepEqual(errors, []);
  await ctx.close();
  // Existing game: real click flow for all baseline parties, five elections or bankruptcy.
  const gameResults = [];
  for (const party of ["nr", "co", "tw", "ds", "fe", "gr"]) {
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const p = await c.newPage();
    const e = [];
    p.on("pageerror", (x) => e.push(x.message));
    await p.goto(pathToFileURL(path.join(root, "index.html")).href);
    await p.locator("[data-a=totitle]").click();
    await p.locator(`[data-a=choose][data-k=${party}]`).click();
    await p.locator("[data-a=start]").click();
    let guard = 0;
    while ((await p.evaluate(() => S.phase)) !== "final" && guard++ < 80) {
      const phase = await p.evaluate(() => S.phase);
      if (phase === "news") {
        if (await p.locator("#spinbtn").count()) {
          await p.locator("#spinbtn").click();
          await p.waitForFunction(() => S.event !== null);
        }
        await p.locator("[data-a=tobudget]").click();
      } else if (phase === "ref") {
        if (await p.locator("[data-a=refvote]").count()) {
          await p.locator("[data-a=stance][data-v=yes]").click();
          await p.locator('[data-a=spend][data-v="1"]').click();
          await p.locator("[data-a=refvote]").click();
        }
        await p.locator("[data-a=refdone]").click();
      } else if (phase === "demo") await p.locator("[data-a=demook]").click();
      else if (phase === "budget") {
        for (let n = 0; n < 3; n++) {
          const card = p.locator("button.pol:not([disabled]):not(.on)").first();
          if (await card.count()) await card.click();
        }
        if (await p.locator("[data-a=rm]").count())
          await p.locator("[data-a=rm]").first().click();
        await p.locator("[data-a=count]").click();
      } else if (phase === "results") {
        await p.locator('[data-a=answer][data-i="0"]').click();
        await p.locator("[data-a=confirm]").click();
      } else if (phase === "imf") await p.locator("[data-a=tofinal]").click();
      else throw new Error("unexpected phase " + phase);
    }
    assert.equal(await p.evaluate(() => S.phase), "final");
    assert.deepEqual(e, []);
    await p.locator("#refl0").fill("樣稿回歸測試");
    assert(await p.evaluate(() => summaryText().includes("樣稿回歸測試")));
    gameResults.push(
      await p.evaluate(
        (party) => ({ party, rounds: S.history.length, bankrupt: S.bankrupt }),
        party,
      ),
    );
    await c.close();
  }
  await browser.close();
  const result = {
    checks,
    gameResults,
    errors,
    date: new Date().toISOString(),
    browser: "Playwright with locally installed Edge, headless",
  };
  console.log(JSON.stringify(result, null, 2));
})().catch(async (e) => {
  console.error(e);
  if (browser) await browser.close();
  process.exitCode = 1;
});
