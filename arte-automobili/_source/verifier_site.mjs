// Contrôle du site construit (10_site-web/_site) : liens, console, formulaire, menu mobile, accessibilité.
// Usage : node verifier_site.mjs [chemin/vers/axe.min.js]   (axe-core facultatif)
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '../10_site-web/_site');
const AXE = process.argv[2] && existsSync(process.argv[2]) ? readFileSync(process.argv[2], 'utf8') : null;
const PORT = 8790;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = ['/', '/services/', '/presentation/', '/contact/', '/mentions-legales/', '/confidentialite/', '/contact/merci/'];

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await chromium.launch();
const echecs = [];
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) echecs.push(msg); };

try {
  // 1. Chaque page : aucune erreur console, aucune ressource manquante, liens internes valides, un seul h1
  const liens = new Set();
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const url of PAGES) {
      const page = await browser.newPage({ viewport: vp });
      const erreurs = [];
      page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(m.text()); });
      page.on('pageerror', e => erreurs.push(e.message));
      page.on('response', r => { if (r.status() >= 400) erreurs.push(`${r.status()} ${r.url()}`); });
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 40)); }
      });
      await page.waitForLoadState('networkidle');
      const infos = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        liens: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
        imgSansAlt: [...document.querySelectorAll('img:not([alt])')].length,
        debordement: document.documentElement.scrollWidth > window.innerWidth,
        titre: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        boutonsVides: [...document.querySelectorAll('a.btn, button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length,
      }));
      infos.liens.forEach(l => liens.add(l));
      ok(erreurs.length === 0, `${vp.width}px ${url} : console et ressources sans erreur${erreurs.length ? ' → ' + erreurs.join(' | ') : ''}`);
      ok(infos.h1 === 1 && infos.imgSansAlt === 0 && !infos.debordement && infos.titre && infos.description && infos.boutonsVides === 0,
        `${vp.width}px ${url} : 1 h1 (${infos.h1}), alt partout, pas de débordement horizontal, titre et description`);
      if (AXE && vp.width === 1440) {
        await page.waitForTimeout(1500); // fin des fondus d'apparition
        await page.addScriptTag({ content: AXE });
        const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations
          .map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`));
        ok(res.length === 0, `${url} : audit d'accessibilité axe-core${res.length ? ' → ' + res.join(' | ') : ''}`);
      }
      await page.close();
    }
  }
  for (const l of liens) {
    if (/^(mailto:|tel:|https?:)/.test(l)) continue;
    const [chemin, ancre] = l.split('#');
    const p = chemin.split('?')[0] || '/';
    const fichier = join(SITE, p.endsWith('/') ? p + 'index.html' : p);
    let valide = existsSync(fichier);
    if (valide && ancre) valide = readFileSync(fichier, 'utf8').includes(`id="${ancre}"`);
    ok(valide, `lien interne ${l}`);
  }

  // 2. Formulaire
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const requetes = [];
  page.on('request', r => { if (r.method() === 'POST') requetes.push(r); });
  await page.goto(BASE + '/contact/?service=complet', { waitUntil: 'networkidle' });
  ok(await page.$eval('#f-service', s => s.value) === 'Lavage intérieur + extérieur', 'service présélectionné depuis la page Services (?service=complet)');
  await page.selectOption('#f-service', { index: 0 }).catch(() => {});
  await page.evaluate(() => { document.querySelector('#f-service').value = ''; });
  await page.click('[data-envoyer]');
  const invalides = await page.$$eval('[aria-invalid="true"]', els => els.map(e => e.id));
  ok(invalides.join() === 'f-nom,f-email,f-service,f-accord', `envoi vide bloqué, champs signalés : ${invalides.join(', ')}`);
  ok(await page.evaluate(() => document.activeElement.id) === 'f-nom', 'le focus va au premier champ en erreur');
  ok(requetes.length === 0, 'aucune requête envoyée tant que le formulaire est invalide');

  const remplir = async (p) => {
    await p.fill('#f-nom', 'Test Contrôle');
    await p.fill('#f-email', 'test@example.com');
    await p.fill('#f-tel', '06 00 00 00 00');
    await p.selectOption('#f-service', { label: 'Lavage extérieur' });
    await p.fill('#f-vehicule', 'Coupé test');
    await p.fill('#f-message', 'Message de test');
    await p.check('#f-accord');
  };
  await page.fill('#f-email', 'pas-une-adresse');
  await page.locator('#f-email').blur();
  ok(await page.getAttribute('#f-email', 'aria-invalid') === 'true', 'adresse e-mail invalide signalée');

  // 2a. Sans service d'envoi réel (serveur local) : l'échec doit être annoncé, jamais un faux succès
  await remplir(page);
  await page.click('[data-envoyer]');
  await page.waitForSelector('.form__statut .notice--erreur', { timeout: 10000 });
  ok(await page.isVisible('[data-form]') && !(await page.isVisible('[data-confirmation]')), 'serveur sans réception de formulaire → message d\'erreur, pas de confirmation');

  // 2b. Netlify répond 200 → confirmation
  let corps = '';
  await page.route(BASE + '/', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    corps = route.request().postData();
    return route.fulfill({ status: 200, body: 'ok' });
  });
  await page.click('[data-envoyer]');
  await page.waitForSelector('[data-confirmation]:not([hidden])', { timeout: 10000 });
  const params = new URLSearchParams(corps);
  ok(params.get('form-name') === 'contact' && params.get('nom') === 'Test Contrôle' && params.get('service') === 'Lavage extérieur' && params.get('consentement') === 'Oui',
    'Netlify : données envoyées en x-www-form-urlencoded avec form-name=contact');
  ok(await page.evaluate(() => document.activeElement.matches('[data-confirmation]')), 'confirmation affichée et focalisée après réponse positive');

  // 2c. Netlify répond 500 → erreur
  const p2 = await ctx.newPage();
  await p2.route(BASE + '/', (route) => route.request().method() === 'POST' ? route.fulfill({ status: 500, body: 'erreur' }) : route.continue());
  await p2.goto(BASE + '/contact/', { waitUntil: 'networkidle' });
  await remplir(p2);
  await p2.click('[data-envoyer]');
  await p2.waitForSelector('.form__statut .notice--erreur', { timeout: 10000 });
  ok(!(await p2.isVisible('[data-confirmation]')) && (await p2.isEnabled('[data-envoyer]')), 'réponse 500 → message d\'erreur, bouton réactivé pour réessayer');

  // 2d. Variante Web3Forms (page modifiée à la volée) : succès seulement si {success:true}
  for (const [reponse, attendu] of [[{ success: true }, 'succès'], [{ success: false, message: 'Clé invalide' }, 'erreur']]) {
    const p3 = await ctx.newPage();
    await p3.route(BASE + '/contact/', async (route) => {
      const r = await route.fetch();
      const html = (await r.text()).replace('data-envoi="netlify"', 'data-envoi="web3forms"');
      return route.fulfill({ response: r, body: html });
    });
    let recu = null;
    await p3.route('https://api.web3forms.com/submit', (route) => { recu = route.request(); return route.fulfill({ status: reponse.success ? 200 : 400, contentType: 'application/json', body: JSON.stringify(reponse) }); });
    await p3.goto(BASE + '/contact/', { waitUntil: 'networkidle' });
    await remplir(p3);
    await p3.click('[data-envoyer]');
    await p3.waitForSelector(attendu === 'succès' ? '[data-confirmation]:not([hidden])' : '.form__statut .notice--erreur', { timeout: 10000 });
    ok(recu !== null, `Web3Forms (${attendu}) : requête envoyée à api.web3forms.com et ${attendu} affiché`);
    await p3.close();
  }

  // 3. Menu mobile au clavier
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  await m.click('[data-menu-toggle]');
  ok(await m.isVisible('[data-menu]') && await m.getAttribute('[data-menu-toggle]', 'aria-expanded') === 'true', 'menu mobile : ouverture');
  ok(await m.evaluate(() => document.activeElement.closest('[data-menu]') !== null), 'menu mobile : le focus entre dans le menu');
  await m.keyboard.press('Escape');
  ok(!(await m.isVisible('[data-menu]')) && await m.evaluate(() => document.activeElement.matches('[data-menu-toggle]')), 'menu mobile : Échap ferme et rend le focus au bouton');
  await m.click('[data-menu-toggle]');
  await m.click('[data-menu] a[href="/services/"]');
  await m.waitForURL(BASE + '/services/');
  ok(true, 'menu mobile : navigation vers Services');

  // 4. Lien d'évitement
  const k = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await k.goto(BASE + '/services/', { waitUntil: 'networkidle' });
  await k.keyboard.press('Tab');
  ok(await k.evaluate(() => document.activeElement.classList.contains('skip')), 'premier Tab : lien « Aller au contenu »');
} finally {
  await browser.close();
  srv.kill();
}
console.log(echecs.length ? `\n${echecs.length} contrôle(s) en échec` : '\nTous les contrôles sont passés.');
process.exit(echecs.length ? 1 : 0);
