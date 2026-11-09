// Rendu HTML/SVG → PNG / JPG / PDF avec Chromium (Playwright préinstallé).
// Usage : node render.mjs jobs.json   où jobs = [{in, out, w, h, scale?, pdf?:{width,height}, fullsize?, wait?}]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;

const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
for (const j of jobs) {
  const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: j.scale || 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', j.in, m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', j.in, e.message));
  await page.goto(j.url || pathToFileURL(resolve(j.in)).href, { waitUntil: 'networkidle', timeout: 240000 });
  await page.evaluate(() => document.fonts.ready);
  if (j.wait) await page.waitForFunction(j.wait, null, { timeout: j.timeout || 240000 });
  if (j.css) await page.addStyleTag({ content: j.css });
  if (j.fullsize) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: j.w, height: h });
    await page.waitForTimeout(300);
  }
  mkdirSync(dirname(resolve(j.out)), { recursive: true });
  if (j.pdf) {
    await page.pdf({ path: j.out, width: j.pdf.width, height: j.pdf.height, printBackground: true, preferCSSPageSize: true });
  } else {
    const jpg = j.out.endsWith('.jpg');
    await page.screenshot({ path: j.out, fullPage: !!j.fullsize, type: jpg ? 'jpeg' : 'png', quality: jpg ? (j.quality || 90) : undefined, omitBackground: !!j.transparent });
  }
  console.log('→', j.out);
  await ctx.close();
}
await browser.close();
