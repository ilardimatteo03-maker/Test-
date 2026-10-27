// Imprime les grilles tarifaires HTML de 17_tarifs en PDF A4 (Chromium, arrière-plans inclus).
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { join, resolve, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
const dossier = resolve(dirname(fileURLToPath(import.meta.url)), '../../17_tarifs');
const b = await chromium.launch();
for (const nom of ['tarifs-arte-automobili']) {
  const p = await b.newPage();
  await p.goto('file://' + join(dossier, nom + '.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const polices = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.style));
  // contenu hors de la page ou blocs qui se chevauchent (le monogramme en filigrane déborde volontairement)
  const deborde = await p.evaluate(() => {
    const pg = document.querySelector('.page').getBoundingClientRect();
    const hors = [...document.querySelectorAll('.page *')].some(e => !e.closest('.filigrane') && e.getBoundingClientRect().bottom > pg.bottom + 1);
    const th = [...document.querySelectorAll('thead th')].filter(e => e.textContent.trim()).map(e => e.firstChild);
    const r = th.map(n => { const g = document.createRange(); g.selectNodeContents(n); return g.getBoundingClientRect(); });
    const entetes = r.some((x, i) => i && x.left < r[i - 1].right + 4);
    return hors || entetes;
  });
  await p.pdf({ path: join(dossier, nom + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(nom, '| polices chargées :', [...new Set(polices)].join(', '), '| débordement :', deborde);
  await p.close();
}
await b.close();
