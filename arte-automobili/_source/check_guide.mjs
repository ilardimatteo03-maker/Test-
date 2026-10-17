// Contrôle de mise en page du guide en mode impression : signale tout élément qui
// dépasse la zone utile d'une page (1600 × 900, pied de page réservé).
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { join, resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.emulateMedia({ media: 'print' });
await p.goto(pathToFileURL(resolve(process.argv[2])).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const res = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
  const r = pg.getBoundingClientRect(); const limit = r.top + 900 - 58, top = r.top + 62; let worst = 0, who = '';
  pg.querySelectorAll('*').forEach(el => { if (el.closest('.foot') || el.closest('.run')) return;
    const e = el.getBoundingClientRect(); if (e.height === 0) return;
    const o = Math.max(e.bottom - limit, top - e.top); if (o > worst) { worst = o; who = el.tagName + '.' + el.className + ' ' + (el.textContent || '').trim().slice(0, 40); } });
  return { page: i + 1, over: Math.round(worst), who };
}).filter(x => x.over > 2));
console.log(res.length ? res.map(r => `p${r.page}: +${r.over}px ${r.who}`).join('\n') : 'aucun débordement');
await b.close();
