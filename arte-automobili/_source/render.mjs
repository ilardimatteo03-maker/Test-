// Rendu HTML → PNG / PDF avec Chromium (Playwright).
// Usage : node render.mjs jobs.json   où jobs = [{in, out, w, h, scale?, pdf?:{width,height}}]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Playwright est installé globalement dans l'environnement de build
const require = createRequire(import.meta.url);
const { chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright'));

const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const j of jobs) {
  const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: j.scale || 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', j.in, m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', j.in, e.message));
  await page.goto(j.url || pathToFileURL(resolve(j.in)).href, { waitUntil: 'networkidle', timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  if (j.wait) await page.waitForFunction(j.wait, null, { timeout: j.timeout || 120000 });
  if (j.fullsize) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: j.w, height: h });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  }
  if (j.pdf) {
    await page.pdf({ path: j.out, width: j.pdf.width, height: j.pdf.height, printBackground: true, preferCSSPageSize: true });
  } else {
    await page.screenshot({ path: j.out, fullPage: !!j.full, omitBackground: !!j.transparent });
  }
  await ctx.close();
  console.log('✓', j.out);
}
await browser.close();
