// Imprime en PDF A4 les documents HTML passés en arguments (même nom, extension .pdf) et signale tout débordement.
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch();
for (const html of process.argv.slice(2).map(f => resolve(f))) {
  const p = await b.newPage();
  await p.goto('file://' + html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const polices = await p.evaluate(() => [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))].length);
  // chaque .feuille doit tenir sur une page A4 (297 mm moins 2 × 16 mm de marge = 264 mm)
  const trop = await p.evaluate(() => {
    const mm = document.querySelector('.feuille').getBoundingClientRect().width / 210;
    return [...document.querySelectorAll('.feuille')].map(f => f.scrollHeight / mm).filter(h => h > 264.5).map(h => h.toFixed(1) + ' mm');
  });
  const pdf = html.replace(/\.html$/, '.pdf');
  await p.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(pdf.split('/').slice(-2).join('/'), '| polices :', polices, trop.length ? '| ⚠ déborde : ' + trop.join(', ') : '| tient sur la page');
  await p.close();
}
await b.close();
