// Screenshot every page of the built site and diff against committed baselines.
//
// This exists because the failures that hurt this site render a 200 on every
// URL. When the stylesheet moved to a new path on 2026-09-17, every page still
// returned 200 with correct HTML -- and every page was unstyled. Only pixels
// show that.
//
// Baselines live in test/visual/baseline/ and are generated on the CI runner,
// so they must be regenerated there (not on a Mac) when the design changes.

import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.SITE_URL ?? "http://127.0.0.1:4000";
const DIR = new URL(".", import.meta.url).pathname;
const BASELINE = join(DIR, "baseline");
const OUTPUT = join(DIR, "output");

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

// Pixel difference above which a page is considered changed. Antialiasing and
// font hinting produce a small nonzero floor even between identical renders.
const THRESHOLD_RATIO = 0.002; // 0.2% of pixels

mkdirSync(OUTPUT, { recursive: true });
mkdirSync(BASELINE, { recursive: true });

const browser = await chromium.launch();
const created = [];
const changed = [];
const unchanged = [];

for (const [vpName, viewport] of VIEWPORTS) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  for (const [name, path] of PAGES) {
    const key = `${name}-${vpName}.png`;
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    // Freeze anything time- or motion-dependent so diffs mean something.
    await page.addStyleTag({
      content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
    });
    const shot = await page.screenshot({ fullPage: true });
    const outPath = join(OUTPUT, key);
    writeFileSync(outPath, shot);

    const basePath = join(BASELINE, key);
    if (!existsSync(basePath)) {
      writeFileSync(basePath, shot);
      created.push(key);
      continue;
    }

    const a = PNG.sync.read(readFileSync(basePath));
    const b = PNG.sync.read(shot);
    if (a.width !== b.width || a.height !== b.height) {
      changed.push(`${key} (size ${a.width}x${a.height} -> ${b.width}x${b.height})`);
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const px = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    const ratio = px / (a.width * a.height);
    if (ratio > THRESHOLD_RATIO) {
      writeFileSync(join(OUTPUT, `DIFF-${key}`), PNG.sync.write(diff));
      changed.push(`${key} (${px} px, ${(ratio * 100).toFixed(2)}%)`);
    } else {
      unchanged.push(key);
    }
  }
  await page.close();
}
await browser.close();

const summary = [
  `Unchanged: ${unchanged.length}`,
  created.length ? `Baselines created (commit test/visual/baseline/): ${created.join(", ")}` : null,
  changed.length ? `CHANGED:\n  ${changed.join("\n  ")}` : null,
].filter(Boolean).join("\n");

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, "## Visual diff\n\n```\n" + summary + "\n```\n", { flag: "a" });
}

// Changed pages are reported, not fatal: a real design change legitimately
// changes pixels. The artifact is there to be looked at.
if (changed.length) console.log("\nDownload the `visual-diff` artifact to see DIFF-*.png overlays.");
