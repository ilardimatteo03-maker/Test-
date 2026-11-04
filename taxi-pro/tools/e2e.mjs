// Tests de bout en bout du thème TAXI PRO dans un vrai navigateur (Playwright + Chromium).
//   node taxi-pro/tools/e2e.mjs [--shots]
// Démarre l'aperçu local du thème et le service de réservation, puis vérifie :
//   1. chaque page (ordinateur 1440 px, mobile 390 px) : console sans erreur, un seul h1, pas de défilement
//      horizontal, images avec alt, audit d'accessibilité axe-core (WCAG 2.1 AA) ;
//   2. le parcours de réservation sans backend (formulaire de contact Shopify) ;
//   3. le formulaire rapide du héros → réservation préremplie ;
//   4. le parcours avec backend : prix revalidé, demande, paiement Stripe simulé, retour, confirmation par webhook ;
//   5. la réservation sur mobile (barre de prix, étapes).
// Les services cartographiques externes (Photon, OSRM, tuiles) sont simulés avec des réponses au format
// documenté : le réseau de l'environnement de test ne les autorise pas.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { startPreview } from './preview/server.mjs';
import { createApp } from '../backend/src/server.js';
import { normalizeTenant } from '../backend/src/config.js';
import { outbox } from '../backend/src/email.js';

const require = createRequire(import.meta.url);
const { chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
const P = require('../theme/assets/tp-pricing.js');
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.argv.includes('--shots') ? join(HERE, '..', 'docs', 'apercus') : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const AXE = readFileSync(join(HERE, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const failures = [];
const ok = (cond, msg, detail) => { console.log(`${cond ? '✓' : '✗'} ${msg}${!cond && detail ? ` → ${detail}` : ''}`); if (!cond) failures.push(msg); };

/* ---------- Simulations des services cartographiques ---------- */
const PLACES = [
  { key: 'louise', name: 'Avenue Louise 200', street: 'Avenue Louise', housenumber: '200', postcode: '1050', city: 'Ixelles', lat: 50.827, lng: 4.36 },
  { key: 'airport', name: 'Brussels Airport', postcode: '1930', city: 'Zaventem', lat: 50.901, lng: 4.4844 },
  { key: 'midi', name: 'Gare de Bruxelles-Midi', postcode: '1060', city: 'Saint-Gilles', lat: 50.8357, lng: 4.336 },
  { key: 'leuven', name: 'Leuven', postcode: '3000', city: 'Leuven', lat: 50.8798, lng: 4.7005 }
];
const haversine = (a, b) => { const r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.sqrt(x)); };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
async function mockGeo(context) {
  await context.route('https://photon.komoot.io/**', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q').toLowerCase();
    const hits = PLACES.filter((p) => q.split(/\s+/).some((w) => w.length > 2 && (p.name + ' ' + p.city + ' ' + p.key).toLowerCase().includes(w)));
    route.fulfill({ json: { type: 'FeatureCollection', features: hits.map((p, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: { osm_type: 'N', osm_id: 1000 + i, name: p.name, street: p.street, housenumber: p.housenumber, postcode: p.postcode, city: p.city, country: 'Belgique', countrycode: 'BE' } })) } });
  });
  await context.route('https://router.project-osrm.org/**', (route) => {
    const m = /driving\/([-\d.]+),([-\d.]+);([-\d.]+),([-\d.]+)/.exec(route.request().url());
    const a = { lng: +m[1], lat: +m[2] }, b = { lng: +m[3], lat: +m[4] };
    const km = haversine(a, b) * 1.3;
    route.fulfill({ json: { code: 'Ok', routes: [{ distance: km * 1000, duration: km / 45 * 3600, geometry: { type: 'LineString', coordinates: [[a.lng, a.lat], [(a.lng + b.lng) / 2 + 0.01, (a.lat + b.lat) / 2], [b.lng, b.lat]] } }] } });
  });
  await context.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ body: PNG, contentType: 'image/png' }));
}

/* ---------- Utilitaires de navigation ---------- */
async function newPage(browser, viewport, { mobile = false } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: SHOTS ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'fr-BE', timezoneId: 'Europe/Brussels' });
  await mockGeo(context);
  const page = await context.newPage();
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/nope') && !r.url().includes('fonts.g')) page.__errors.push(`${r.status()} ${r.url()}`); });
  return page;
}
async function chooseAddress(page, scope, key, query) {
  const input = page.locator(`${scope} [data-tp-address="${key}"] [data-tp-input]`);
  await input.fill(query);
  const option = page.locator(`${scope} [data-tp-address="${key}"] [role="option"]`).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
}
function futureDate(days) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}
function safeDay() {
  // Jour de semaine non férié, au moins 3 jours plus tard
  const cfg = P.normalizeConfig(JSON.parse(readFileSync(join(HERE, '..', 'tests', 'fixtures', 'config.json'), 'utf8')));
  for (let i = 3; i < 30; i++) {
    const d = futureDate(i), t = P.parseLocal(`${d}T14:00`), wd = new Date(t).getUTCDay();
    if (wd >= 1 && wd <= 5 && !P.isHoliday(t, cfg.surcharges.holiday.dates)) return d;
  }
  return futureDate(8);
}
async function shot(page, name, full = false) {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.jpg`), fullPage: full, type: 'jpeg', quality: 84 });
}

/* ---------- Démarrage des serveurs ---------- */
// Boutique A : sans service de réservation (repli sur le formulaire de contact Shopify).
// Boutique B : avec service de réservation ; le backend lit sa configuration sur cette boutique.
const preview = await startPreview({ port: 0 });
const PREVIEW = preview.url;
const bOverrides = {};
const previewB = await startPreview({ port: 0, overrides: bOverrides });
const PREVIEW_B = previewB.url;
const STRIPE_WH = 'whsec_e2e';
const stripeRequests = [];
const backendFetch = async (url, init) => {
  const u = String(url);
  if (u.startsWith('https://api.stripe.com/')) {
    stripeRequests.push(new URLSearchParams(init.body));
    return new Response(JSON.stringify({ id: 'cs_e2e', url: 'https://checkout.stripe.test/pay/cs_e2e' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return fetch(url, init);
};
const backendConfig = {
  port: 0, host: '127.0.0.1', publicUrl: '', dataDir: mkdtempSync(join(tmpdir(), 'taxipro-e2e-')), configCacheSeconds: 1, trustProxy: false,
  tenants: [normalizeTenant({
    id: 'e2e', shopDomain: 'taxi-exemple.myshopify.com', storefrontUrl: PREVIEW_B, allowedOrigins: [PREVIEW_B],
    routing: { provider: 'estimate', roadFactor: 1.3 }, email: { provider: 'memory', adminEmail: 'planning@exemple.be' },
    payments: { provider: 'stripe', stripeSecretKey: 'sk_test_e2e', stripeWebhookSecret: STRIPE_WH }, adminToken: 'e2e-admin'
  })]
};
const backend = createApp({ config: backendConfig, fetchImpl: backendFetch });
await new Promise((r) => backend.server.listen(0, '127.0.0.1', r));
const BACKEND = `http://127.0.0.1:${backend.server.address().port}`;
Object.assign(bOverrides, { backend_url: BACKEND, geo_routing: 'backend', payment_online: true, payment_deposit: true });

const browser = await chromium.launch();
try {
  /* 1. Pages : ordinateur et mobile */
  const PAGES = ['/', '/pages/reservation', '/pages/services', '/pages/vehicules', '/pages/a-propos', '/pages/contact', '/pages/faq', '/pages/tarifs', '/pages/mentions-legales', '/search', '/nope'];
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await newPage(browser, vp, { mobile: vp.width < 500 });
    for (const path of PAGES) {
      page.__errors = [];
      await page.goto(PREVIEW + path, { waitUntil: 'networkidle' });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
      const info = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        imgNoAlt: document.querySelectorAll('img:not([alt])').length,
        emptyButtons: [...document.querySelectorAll('a.btn, button')].filter((b) => b.offsetParent && !b.textContent.trim() && !b.getAttribute('aria-label')).length,
        title: document.title, missing: document.body.innerHTML.includes('translation missing')
      }));
      const errs = path === '/nope' ? page.__errors.filter((e) => !/404/.test(e)) : page.__errors; // la page 404 répond 404, c'est voulu
      ok(errs.length === 0, `${vp.width}px ${path} : console et ressources sans erreur`, errs.join(' | '));
      ok(info.h1 === 1 && !info.overflow && info.imgNoAlt === 0 && info.emptyButtons === 0 && info.title && !info.missing,
        `${vp.width}px ${path} : 1 h1, pas de débordement, alt, boutons nommés, traductions`, JSON.stringify(info));
      if (vp.width === 1440 && path !== '/nope') {
        // Animations figées pendant l'audit : un élément en cours d'apparition fausserait le contraste
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; } .reveal { opacity: 1 !important; transform: none !important; }' });
        await page.addScriptTag({ content: AXE });
        const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'], resultTypes: ['violations'] })).violations
          .map((x) => `${x.id} (${x.impact}) ×${x.nodes.length} : ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`));
        ok(v.length === 0, `${path} : accessibilité axe-core WCAG 2.1 AA`, v.join(' | '));
      }
      if (path === '/' || path === '/pages/reservation') await shot(page, `${vp.width < 500 ? 'mobile' : 'ordinateur'}-${path === '/' ? 'accueil' : 'reservation'}`, vp.width >= 500 && path === '/');
    }
    await page.context().close();
  }

  /* 2. Parcours complet sans backend : envoi par le formulaire de contact Shopify */
  {
    const page = await newPage(browser, { width: 1440, height: 1000 });
    await page.goto(`${PREVIEW}/pages/reservation`, { waitUntil: 'networkidle' });
    const B = '[data-tp-booking]';
    await page.locator(`${B} .tp-chip:has-text("Taxi classique")`).click();
    await chooseAddress(page, B, 'pickup', 'Avenue Louise');
    await chooseAddress(page, B, 'dropoff', 'Brussels Airport');
    await page.waitForSelector(`${B} [data-tp-route] .tp-route__facts`);
    const day = safeDay();
    await page.fill(`${B} [name="date"]`, day); await page.dispatchEvent(`${B} [name="date"]`, 'change');
    await page.fill(`${B} [name="time"]`, '14:00'); await page.dispatchEvent(`${B} [name="time"]`, 'change');
    await page.click(`${B} [data-tp-stepper="passengers"] [data-tp-inc]`);
    const fromPrice = await page.locator(`${B} .tp-aside [data-tp-total]`).textContent();
    ok(/Dès 45,00/.test(fromPrice), 'étape 1 : prix « dès » affiché pendant la saisie (forfait aéroport 45 €)', fromPrice);
    await shot(page, 'etape-1-trajet');
    await page.click(`${B} .tp-nav [data-tp-next]`);
    const cards = await page.locator(`${B} .tp-vehicle`).count();
    ok(cards === 4, 'étape 2 : 4 véhicules proposés (le véhicule désactivé est masqué)', String(cards));
    const prices = await page.locator(`${B} .tp-vehicle__price strong`).allTextContents();
    ok(prices[0].includes('45,00') && prices[2].includes('65,00') && prices[3].includes('70,00'), 'étape 2 : prix par véhicule (forfait, prix van et classe affaires)', prices.join(' / '));
    await page.locator(`${B} .tp-nav [data-tp-next]`).click();
    const err = await page.locator(`${B} [data-tp-step="2"] [data-tp-errors]`).textContent();
    ok(/Choisissez un véhicule/.test(err), 'étape 2 : impossible de continuer sans véhicule');
    await page.locator(`${B} .tp-vehicle`).first().click();
    await shot(page, 'etape-2-vehicule');
    await page.click(`${B} .tp-nav [data-tp-next]`);
    await page.locator(`${B} [data-option-check="siege-bebe"]`).check();
    await page.locator(`${B} [data-option-stepper="bagage-volumineux"] [data-tp-inc]`).click();
    const total3 = await page.locator(`${B} .tp-aside [data-tp-total]`).textContent();
    ok(total3.includes('63,00'), 'étape 3 : options ajoutées au total (45 + 10 + 8)', total3);
    await shot(page, 'etape-3-options');
    await page.click(`${B} .tp-nav [data-tp-next]`);
    await page.click(`${B} .tp-nav [data-tp-next]`);
    const e4 = await page.locator(`${B} [data-tp-step="4"] [data-tp-errors] li`).count();
    ok(e4 >= 4, 'étape 4 : champs obligatoires contrôlés', String(e4));
    const modes = await page.locator(`${B} .tp-pay input`).evaluateAll((els) => els.map((e) => e.value));
    ok(modes.join(',') === 'request,driver', 'étape 4 : sans backend, pas de paiement en ligne proposé', modes.join(','));
    await page.fill(`${B} [name="firstName"]`, 'Léa'); await page.fill(`${B} [name="lastName"]`, 'Martin');
    await page.fill(`${B} [name="email"]`, 'lea@example.com'); await page.fill(`${B} [name="phone"]`, '+32 470 12 34 56');
    await page.fill(`${B} [name="flight"]`, 'sn3204');
    await page.check(`${B} [name="terms"]`);
    await shot(page, 'etape-4-coordonnees');
    await page.click(`${B} .tp-nav [data-tp-next]`);
    const summary = await page.locator(`${B} [data-tp-summary]`).textContent();
    ok(summary.includes('Avenue Louise') && summary.includes('Brussels Airport') && summary.includes('Siège bébé') && summary.includes('63,00'), 'étape 5 : récapitulatif complet', summary.slice(0, 200));
    ok((await page.locator(`${B} [data-tp-notice]`).textContent()).includes('après notre confirmation'), 'étape 5 : la réservation est annoncée comme non confirmée');
    await shot(page, 'etape-5-recapitulatif');
    await page.click(`${B} [data-tp-confirm]`);
    await page.waitForSelector(`${B} .tp-result`, { timeout: 10000 });
    const result = await page.locator(`${B} .tp-result`).textContent();
    ok(/Demande envoyée/.test(result) && /pas encore confirmée/.test(result) && !/confirmée\./.test(result.replace('pas encore confirmée', '')), 'envoi sans backend : « Demande envoyée », jamais « confirmée »', result.slice(0, 160));
    const contacts = await (await fetch(`${PREVIEW}/__contact`)).json();
    const c = contacts[contacts.length - 1];
    ok(c && c['contact[email]'] === 'lea@example.com' && c['contact[body]'].includes('63,00') && c['contact[body]'].includes('GPS départ'), 'formulaire de contact Shopify : demande complète transmise', JSON.stringify(c || {}).slice(0, 200));
    await shot(page, 'envoi-demande');
    ok(page.__errors.length === 0, 'parcours sans backend : aucune erreur console', page.__errors.join(' | '));
    await page.context().close();
  }

  /* 3. Formulaire rapide du héros → page de réservation préremplie */
  {
    const page = await newPage(browser, { width: 1440, height: 900 });
    await page.goto(`${PREVIEW}/?set_booking_page=reservation`, { waitUntil: 'networkidle' });
    const Q = '[data-tp-quick]';
    await chooseAddress(page, Q, 'pickup', 'Gare Midi');
    await chooseAddress(page, Q, 'dropoff', 'Leuven');
    await page.click(`${Q} [type="submit"]`);
    await page.waitForSelector(`${Q} .tp-quick__price`);
    const qp = await page.locator(`${Q} .tp-quick__price`).textContent();
    const km = Math.round(haversine(PLACES[2], PLACES[3]) * 1.3 * 10) / 10;
    const exp = P.quote(JSON.parse(readFileSync(join(HERE, '..', 'tests', 'fixtures', 'config.json'), 'utf8')), {}, {});
    void exp;
    ok(/Dès .*€/.test(qp) && qp.includes(`${String(km).replace('.', ',')} km`), 'formulaire rapide : prix réel et distance affichés', qp);
    await shot(page, 'formulaire-rapide');
    await page.click(`${Q} [data-tp-quick-book]`);
    await page.waitForURL(/pages\/reservation/);
    await page.waitForSelector('[data-tp-step="2"]:not([hidden]) .tp-vehicle', { timeout: 8000 });
    const pick = await page.inputValue('[data-tp-booking] [data-tp-address="pickup"] input');
    ok(pick.includes('Bruxelles-Midi'), 'réservation préremplie depuis le formulaire rapide, ouverte à l’étape « Véhicule »', pick);
    await page.context().close();
  }

  /* 4. Avec backend : prix revalidé, demande, paiement en ligne et confirmation */
  {
    const page = await newPage(browser, { width: 1440, height: 1000 });
    await page.context().route('https://checkout.stripe.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Stripe (test)</title><h1>Paiement simulé</h1>' }));
    const B = '[data-tp-booking]';
    const book = async (payment) => {
      await page.goto(`${PREVIEW_B}/pages/reservation`, { waitUntil: 'networkidle' });
      await page.evaluate(() => sessionStorage.clear());
      await page.goto(`${PREVIEW_B}/pages/reservation`, { waitUntil: 'networkidle' });
      await chooseAddress(page, B, 'pickup', 'Gare Midi');
      await chooseAddress(page, B, 'dropoff', 'Leuven');
      await page.waitForSelector(`${B} [data-tp-route] .tp-route__facts`);
      await page.fill(`${B} [name="date"]`, safeDay()); await page.dispatchEvent(`${B} [name="date"]`, 'change');
      await page.fill(`${B} [name="time"]`, '14:00'); await page.dispatchEvent(`${B} [name="time"]`, 'change');
      await page.click(`${B} .tp-nav [data-tp-next]`);
      await page.locator(`${B} .tp-vehicle`).first().click();
      await page.click(`${B} .tp-nav [data-tp-next]`);
      await page.click(`${B} .tp-nav [data-tp-next]`);
      await page.fill(`${B} [name="firstName"]`, 'Tom'); await page.fill(`${B} [name="lastName"]`, 'Peeters');
      await page.fill(`${B} [name="email"]`, 'tom@example.com'); await page.fill(`${B} [name="phone"]`, '+32 475 00 00 00');
      await page.check(`${B} [name="terms"]`);
      await page.locator(`${B} .tp-pay input[value="${payment}"]`).check();
      await page.click(`${B} .tp-nav [data-tp-next]`);
    };
    const modes = async () => page.locator(`${B} .tp-pay input`).evaluateAll((els) => els.map((e) => e.value));
    outbox.length = 0;
    await book('request');
    ok((await modes()).join(',') === 'request,driver,online,deposit', 'avec backend : paiement en ligne et acompte proposés');
    await page.click(`${B} [data-tp-confirm]`);
    await page.waitForSelector(`${B} .tp-result`, { timeout: 10000 });
    const r1 = await page.locator(`${B} .tp-result`).textContent();
    ok(/Demande envoyée/.test(r1) && /TP-\d{6}-/.test(r1), 'avec backend : demande enregistrée avec une référence, statut non confirmé', r1.slice(0, 160));
    ok(outbox.some((m) => m.to.includes('tom@example.com')) && outbox.some((m) => m.to.includes('planning@exemple.be')), 'avec backend : e-mails au client et à l’entreprise');
    ok(await page.locator(`${B} .tp-result a[href*="/ics?token="]`).count() === 1, 'avec backend : lien « Ajouter à mon agenda »');

    // Paiement en ligne
    await book('online');
    const confirmLabel = await page.locator(`${B} [data-tp-confirm]`).textContent();
    ok(/Payer .*€ et réserver/.test(confirmLabel), 'paiement en ligne : bouton « Payer … et réserver »', confirmLabel);
    await shot(page, 'paiement-en-ligne');
    await Promise.all([page.waitForURL(/checkout\.stripe\.test/), page.click(`${B} [data-tp-confirm]`)]);
    const form = stripeRequests[stripeRequests.length - 1];
    const bookingId = form.get('metadata[booking_id]');
    const success = form.get('success_url');
    ok(bookingId && success.startsWith(`${PREVIEW_B}/pages/reservation?tp_booking=`), 'paiement en ligne : session de paiement créée côté serveur avec le prix serveur', success);
    // Retour avant le webhook : jamais « confirmée »
    await page.goto(success, { waitUntil: 'networkidle' });
    await page.waitForSelector(`${B} .tp-result`);
    const before = await page.locator(`${B} .tp-result`).textContent();
    ok(/vérification/.test(before) && !/Réservation confirmée/.test(before), 'retour du paiement avant webhook : « paiement en cours de vérification »', before.slice(0, 120));
    const amount = Number(form.get('line_items[0][price_data][unit_amount]'));
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_e2e', payment_status: 'paid', amount_total: amount, currency: 'eur', metadata: { booking_id: bookingId } } } });
    const t = Math.floor(Date.now() / 1000);
    const sig = `t=${t},v1=${crypto.createHmac('sha256', STRIPE_WH).update(`${t}.${payload}`).digest('hex')}`;
    const wh = await fetch(`${BACKEND}/webhooks/stripe/e2e`, { method: 'POST', body: payload, headers: { 'Stripe-Signature': sig, 'Content-Type': 'application/json' } });
    ok(wh.status === 200, 'webhook Stripe signé accepté');
    await page.waitForSelector(`${B} .tp-result--confirmed`, { timeout: 12000 });
    ok(/Réservation confirmée/.test(await page.locator(`${B} .tp-result`).textContent()), 'après le webhook : la page affiche « Réservation confirmée » (mise à jour automatique)');
    await shot(page, 'reservation-confirmee');

    // Prix falsifié dans le navigateur → recalcul serveur
    await book('driver');
    await page.evaluate(() => { const el = document.querySelector('[data-tp-booking]'); el.__tpBooking.state.serverQuote = { total: 1, lines: [], legs: [], onRequest: false, warnings: [] }; el.__tpBooking.render(); });
    await page.click(`${B} [data-tp-confirm]`);
    await page.waitForSelector(`${B} [data-tp-step="5"] [data-tp-errors]:not([hidden])`);
    const changed = await page.locator(`${B} [data-tp-step="5"] [data-tp-errors]`).textContent();
    ok(/recalculé par notre serveur/.test(changed), 'prix modifié dans le navigateur : le serveur impose son prix', changed);
    ok(page.__errors.filter((e) => !e.includes('409')).length === 0, 'parcours avec backend : aucune erreur console', page.__errors.join(' | '));
    await page.context().close();
  }

  /* 5. Mobile : parcours et barre de prix */
  {
    const page = await newPage(browser, { width: 390, height: 844 }, { mobile: true });
    await page.goto(`${PREVIEW}/pages/reservation`, { waitUntil: 'networkidle' });
    const B = '[data-tp-booking]';
    await page.evaluate(() => sessionStorage.clear());
    await chooseAddress(page, B, 'pickup', 'Avenue Louise');
    await chooseAddress(page, B, 'dropoff', 'Brussels Airport');
    await page.waitForSelector(`${B} [data-tp-route] .tp-route__facts`);
    const bar = page.locator(`${B} .tp-mobilebar`);
    ok(await bar.isVisible(), 'mobile : barre de prix et bouton « Continuer » visibles');
    ok(/Dès 45,00/.test(await bar.locator('[data-tp-total]').textContent()), 'mobile : prix dans la barre');
    const size = await bar.locator('button').boundingBox();
    ok(size.height >= 48, 'mobile : bouton de 48 px de haut minimum', String(size.height));
    await bar.locator('[data-tp-next]').click();
    await page.locator(`${B} .tp-vehicle`).nth(2).click();
    await shot(page, 'mobile-vehicules');
    ok(/65,00/.test(await bar.locator('[data-tp-total]').textContent()), 'mobile : total mis à jour après le choix du van');
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'mobile : pas de défilement horizontal pendant la réservation');
    await page.context().close();
  }

  /* 6. Préréglages de style */
  for (const preset of ['Premium Black', 'Corporate', 'Modern Taxi', 'Luxury Chauffeur', 'Minimal']) {
    const page = await newPage(browser, { width: 1440, height: 900 });
    await page.goto(`${PREVIEW}/?preset=${encodeURIComponent(preset)}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; } .reveal { opacity: 1 !important; transform: none !important; }' });
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations'] })).violations.map((x) => `${x.nodes.length} × ${x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`));
    ok(v.length === 0, `préréglage ${preset} : contrastes conformes (WCAG AA)`, v.join(' | '));
    await shot(page, `prereglage-${preset.toLowerCase().replace(/ /g, '-')}`);
    await page.context().close();
  }
} finally {
  await browser.close();
  preview.server.close();
  previewB.server.close();
  backend.server.close();
}

console.log(`\n${failures.length ? `✗ ${failures.length} échec(s)` : '✓ Tous les contrôles de bout en bout sont passés'}`);
process.exit(failures.length ? 1 : 0);
