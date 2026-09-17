// Render the base branch and this PR side by side and diff the pixels.
//
// This exists because the failures that hurt this site render a 200 on every
// URL. When the stylesheet moved paths on 2026-09-17, every page still
// returned 200 with correct HTML -- and every page was unstyled. Only pixels
// show that.
//
// Both versions are built and screenshotted in the same CI run, on the same
// browser and fonts, so the diff isolates the change. Nothing is committed:
// baseline PNGs would add ~17MB to the repository on every regeneration, and
// go stale the moment the design changes.
//
//   BASE_URL=http://127.0.0.1:4001 HEAD_URL=http://127.0.0.1:4000 node test/visual/compare.mjs

import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4001";
const HEAD_URL = process.env.HEAD_URL ?? "http://127.0.0.1:4000";
const OUTPUT = join(new URL(".", import.meta.url).pathname, "output");

const PAGES = [
  ["home", "/"],
  ["schedule", "/schedule.html"],
  ["coaches", "/coaches.html"],
  ["memberships", "/memberships.html"],
  ["first-class", "/first-class.html"],
  ["faq", "/faq.html"],
  ["reviews", "/reviews.html"],
  ["workouts", "/workouts.html"],
];

const VIEWPORTS = [
  ["desktop", { width: 1280, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

// Antialiasing and font hinting leave a small nonzero floor between renders
// that are meant to be identical.
const THRESHOLD_RATIO = 0.002; // 0.2% of pixels

mkdirSync(OUTPUT, { recursive: true });

async function shoot(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  // Freeze anything time- or motion-dependent so a diff means something.
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  });
  return page.screenshot({ fullPage: true });
}

const browser = await chromium.launch();
const changed = [];
const unchanged = [];

for (const [vpName, viewport] of VIEWPORTS) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  for (const [name, path] of PAGES) {
    const key = `${name}-${vpName}`;

    const beforeBuf = await shoot(page, BASE_URL + path);
    const afterBuf = await shoot(page, HEAD_URL + path);

    const before = PNG.sync.read(beforeBuf);
    const after = PNG.sync.read(afterBuf);

    if (before.width !== after.width || before.height !== after.height) {
      changed.push(`${key}: size ${before.width}x${before.height} -> ${after.width}x${after.height}`);
      writeFileSync(join(OUTPUT, `${key}-before.png`), beforeBuf);
      writeFileSync(join(OUTPUT, `${key}-after.png`), afterBuf);
      continue;
    }

    const diff = new PNG({ width: before.width, height: before.height });
    const px = pixelmatch(before.data, after.data, diff.data, before.width, before.height, { threshold: 0.1 });
    const ratio = px / (before.width * before.height);

    if (ratio > THRESHOLD_RATIO) {
      changed.push(`${key}: ${px} px changed (${(ratio * 100).toFixed(2)}%)`);
      writeFileSync(join(OUTPUT, `${key}-before.png`), beforeBuf);
      writeFileSync(join(OUTPUT, `${key}-after.png`), afterBuf);
      writeFileSync(join(OUTPUT, `${key}-diff.png`), PNG.sync.write(diff));
    } else {
      unchanged.push(key);
    }
  }
  await page.close();
}
await browser.close();

const summary = changed.length
  ? `${changed.length} of ${changed.length + unchanged.length} views changed:\n  ${changed.join("\n  ")}\n\n`
    + `Download the \`visual-diff\` artifact for before/after/diff images.`
  : `No visual change across ${unchanged.length} views (${PAGES.length} pages x ${VIEWPORTS.length} widths).`;

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Visual diff\n\n```\n" + summary + "\n```\n");
}
