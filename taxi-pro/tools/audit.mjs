// Audit complet des liens et des boutons du thème TAXI PRO (Playwright + Chromium).
//   node taxi-pro/tools/audit.mjs
//
// 1. Exploration : à partir de toutes les pages, chaque lien interne est suivi (ordinateur et mobile).
//    Chaque adresse doit répondre 200 ; chaque ancre doit exister ; tel: et mailto: doivent être valides ;
//    aucun lien vide, « # » ou « javascript: » ; liens externes ouverts dans un nouvel onglet avec rel="noopener".
// 2. Boutons : chaque <button> doit avoir une action connue (formulaire, menu, carrousel, carte, réservation…).
// 3. Clics : chaque bouton et chaque lien d'action est cliqué et son effet vérifié.
// Les services cartographiques externes sont simulés (le réseau de test ne les autorise pas).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { startPreview } from './preview/server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync('npm root -g').toString().trim()}/playwright`);

const failures = [];
const ok = (cond, msg, detail) => { console.log(`${cond ? '✓' : '✗'} ${msg}${!cond && detail ? ` → ${detail}` : ''}`); if (!cond) failures.push(msg); };

/* ---------- Simulations (mêmes formats que Photon, OSRM, tuiles) ---------- */
const PLACES = [
  { key: 'louise', name: 'Avenue Louise 200', street: 'Avenue Louise', housenumber: '200', postcode: '1050', city: 'Ixelles', lat: 50.827, lng: 4.36 },
  { key: 'airport', name: 'Brussels Airport', postcode: '1930', city: 'Zaventem', lat: 50.901, lng: 4.4844 },
  { key: 'midi', name: 'Gare de Bruxelles-Midi', postcode: '1060', city: 'Saint-Gilles', lat: 50.8357, lng: 4.336 },
  { key: 'leuven', name: 'Leuven', postcode: '3000', city: 'Leuven', lat: 50.8798, lng: 4.7005 }
];
const haversine = (a, b) => { const r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.sqrt(x)); };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const feature = (p, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: { osm_type: 'N', osm_id: 1000 + i, name: p.name, street: p.street, housenumber: p.housenumber, postcode: p.postcode, city: p.city, country: 'Belgique', countrycode: 'BE' } });
async function mock(context) {
  await context.route('https://photon.komoot.io/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.startsWith('/reverse')) return route.fulfill({ json: { features: [feature(PLACES[0], 0)] } });
    const q = (u.searchParams.get('q') || '').toLowerCase();
    const hits = PLACES.filter((p) => q.split(/\s+/).some((w) => w.length > 2 && (p.name + ' ' + p.city + ' ' + p.key).toLowerCase().includes(w)));
    route.fulfill({ json: { type: 'FeatureCollection', features: hits.map(feature) } });
  });
  await context.route('https://router.project-osrm.org/**', (route) => {
    const m = /driving\/([-\d.]+),([-\d.]+);([-\d.]+),([-\d.]+)/.exec(route.request().url());
    const a = { lng: +m[1], lat: +m[2] }, b = { lng: +m[3], lat: +m[4] };
    const km = haversine(a, b) * 1.3;
    route.fulfill({ json: { code: 'Ok', routes: [{ distance: km * 1000, duration: km / 45 * 3600, geometry: { type: 'LineString', coordinates: [[a.lng, a.lat], [b.lng, b.lat]] } }] } });
  });
  await context.route('https://tile.openstreetmap.org/**', (r) => r.fulfill({ body: PNG, contentType: 'image/png' }));
  await context.route('https://www.openstreetmap.org/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Carte</title>' }));
  await context.route('https://maps.google.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Carte</title>' }));
}

const preview = await startPreview({ port: 0 });
const BASE = preview.url;
const browser = await chromium.launch();

async function newPage(viewport, opts = {}) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500, locale: 'fr-BE', timezoneId: 'Europe/Brussels', ...opts });
  await mock(context);
  const page = await context.newPage();
  page.__errors = [];
  page.on('pageerror', (e) => page.__errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) page.__errors.push(m.text()); });
  return page;
}
const visible = (page, sel) => page.locator(sel).first().isVisible();

try {
  /* ================================================================== */
  /* 1. Exploration de tous les liens                                    */
  /* ================================================================== */
  const SEEDS = ['/', '/?view=reservation', '/?view=services', '/?view=vehicules', '/?view=tarifs', '/?view=a-propos', '/?view=contact', '/?view=faq',
    '/pages/reservation', '/pages/services', '/pages/vehicules', '/pages/tarifs', '/pages/a-propos', '/pages/contact', '/pages/faq', '/pages/mentions-legales',
    '/search', '/cart', '/nope', '/?enable_all=1'];
  const statusCache = new Map();
  const htmlCache = new Map();
  async function fetchStatus(path) {
    if (!statusCache.has(path)) {
      const r = await fetch(BASE + path, { redirect: 'manual' });
      const html = r.headers.get('content-type') || '';
      statusCache.set(path, r.status);
      if (html.includes('text/html')) htmlCache.set(path, await r.text());
    }
    return statusCache.get(path);
  }
  const problems = [];
  let linkCount = 0, buttonCount = 0;
  const seenLinks = new Set();
  const KNOWN_BUTTONS = ['data-menu-open', 'data-menu-close', 'data-slider-prev', 'data-slider-next', 'data-map-load', 'data-tp-locate', 'data-tp-swap',
    'data-tp-dec', 'data-tp-inc', 'data-tp-goto', 'data-tp-next', 'data-tp-back', 'data-tp-confirm', 'data-tp-new', 'data-goto'];

  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await newPage(vp);
    const queue = [...SEEDS];
    const visited = new Set();
    while (queue.length) {
      const path = queue.shift();
      if (visited.has(path)) continue;
      visited.add(path);
      page.__errors = [];
      const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
      if (path !== '/nope' && resp.status() !== 200) problems.push(`${vp.width}px ${path} : statut ${resp.status()}`);
      if (page.__errors.length) problems.push(`${vp.width}px ${path} : erreur JavaScript ${page.__errors.join(' | ')}`);
      const data = await page.evaluate((known) => ({
        links: [...document.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') || '', text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 40) })),
        buttons: [...document.querySelectorAll('button')].map((b) => ({
          text: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 40),
          ok: b.type === 'submit' && !!b.closest('form') || known.some((k) => b.hasAttribute(k)) || !!b.closest('.tp-stepper, .tp-option'),
          html: b.outerHTML.slice(0, 120)
        })),
        ids: [...document.querySelectorAll('[id]')].map((e) => e.id)
      }), KNOWN_BUTTONS);
      for (const b of data.buttons) {
        buttonCount++;
        if (!b.ok) problems.push(`${vp.width}px ${path} : bouton sans action reconnue « ${b.text} » ${b.html}`);
      }
      for (const l of data.links) {
        linkCount++;
        const where = `${vp.width}px ${path} : lien « ${l.text} »`;
        const href = l.href;
        if (href === null || href.trim() === '' || href === '#' || /^javascript:/i.test(href)) { problems.push(`${where} sans destination (${href})`); continue; }
        if (/^tel:/.test(href)) { if (href.replace(/\D/g, '').length < 8) problems.push(`${where} : numéro invalide ${href}`); continue; }
        if (/^mailto:/.test(href)) { if (!/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i.test(href)) problems.push(`${where} : e-mail invalide ${href}`); continue; }
        if (href.startsWith('#')) { if (!data.ids.includes(decodeURIComponent(href.slice(1)))) problems.push(`${where} : ancre introuvable ${href}`); continue; }
        const u = new URL(href, BASE + path);
        if (u.origin !== BASE) {
          if (l.target === '_blank' && !/noopener/.test(l.rel)) problems.push(`${where} : lien externe sans rel="noopener" ${href}`);
          continue;
        }
        const target = u.pathname + u.search;
        const key = `${target}`;
        if (seenLinks.has(key + vp.width)) continue;
        seenLinks.add(key + vp.width);
        const status = await fetchStatus(target);
        if (status !== 200) problems.push(`${where} → ${target} : statut ${status}`);
        if (u.hash && htmlCache.has(target) && !new RegExp(`id="${u.hash.slice(1)}"`).test(htmlCache.get(target))) problems.push(`${where} → ${href} : ancre absente de la page cible`);
        if (status === 200 && htmlCache.has(target) && !u.pathname.startsWith('/policies/') && !/[?&](tp_|contact_posted)/.test(u.search) && !visited.has(target)) queue.push(target);
      }
    }
    ok(true, `${vp.width}px : ${visited.size} pages explorées`);
    await page.context().close();
  }
  ok(problems.length === 0, `exploration : ${linkCount} liens et ${buttonCount} boutons vérifiés sur ordinateur et mobile, aucun lien mort`, problems.slice(0, 12).join('\n   '));
  ok(![...statusCache.keys()].some((p) => /view=taxi-config/.test(p)), 'la page technique ?view=taxi-config n\'est liée nulle part');

  /* ================================================================== */
  /* 2. Clics : en-tête, menus, pied de page                             */
  /* ================================================================== */
  {
    const page = await newPage({ width: 1440, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const nav = await page.locator('.site-nav a').evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));
    ok(nav.map((n) => n[0]).join(',') === 'Accueil,Services,Véhicules,Tarifs,À propos,Contact', 'en-tête : menu intégré (aucun menu Shopify à créer)', JSON.stringify(nav));
    const expectH1 = { Services: 'Nos services', 'Véhicules': 'Nos véhicules', Tarifs: 'Tarifs', 'À propos': 'À propos', Contact: 'Contact' };
    for (const [label, h1] of Object.entries(expectH1)) {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await page.locator('.site-nav a', { hasText: label }).first().click();
      await page.waitForLoadState('domcontentloaded');
      const title = (await page.locator('h1').first().textContent()).trim();
      const current = await page.locator('.site-nav a[aria-current="page"]').first().textContent().catch(() => '');
      ok(title === h1 && current.trim() === label, `menu « ${label} » → page « ${h1} », lien actif signalé`, `${title} / ${current}`);
    }
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('.header-cta').click();
    await page.waitForSelector('[data-tp-booking]');
    ok(true, 'en-tête : bouton « Réserver » → module de réservation');
    await page.goto(BASE + '/?view=services', { waitUntil: 'domcontentloaded' });
    await page.locator('.site-header__logo').click();
    await page.waitForLoadState('domcontentloaded');
    ok(new URL(page.url()).search === '', 'en-tête : logo → accueil');
    const phone = await page.locator('.header-phone').getAttribute('href');
    ok(/^tel:\+32/.test(phone), 'en-tête : téléphone repris des Détails de la boutique (réglage vide)', phone);
    // Lien d'évitement
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => document.activeElement.classList.contains('skip-link'));
    await page.keyboard.press('Enter');
    ok(skip && (await page.evaluate(() => location.hash)) === '#MainContent', 'clavier : lien « Aller au contenu »');
    // Pied de page
    const footerLinks = await page.locator('.site-footer a').evaluateAll((as) => as.map((a) => a.textContent.trim()));
    ok(['Réservation', 'Services', 'Véhicules', 'Tarifs', 'À propos', 'FAQ', 'Contact'].every((t) => footerLinks.includes(t)), 'pied de page : navigation intégrée complète', footerLinks.join(', '));
    ok(['Conditions d\'utilisation', 'Politique de confidentialité', 'Mentions légales'].every((t) => footerLinks.includes(t)), 'pied de page : politiques Shopify affichées automatiquement');
    ok(footerLinks.some((t) => t.includes('contact@exemple.be')) && footerLinks.some((t) => t.includes('+32 2 000 00 00')), 'pied de page : e-mail et téléphone de la boutique');
    await page.context().close();
  }
  {
    const page = await newPage({ width: 390, height: 844 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click('[data-menu-open]');
    await page.waitForSelector('[data-mobile-menu].is-open');
    const items = await page.locator('[data-mobile-menu] nav a').count();
    ok(items === 6, 'mobile : menu ouvert avec 6 liens', String(items));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    ok(!(await page.locator('[data-mobile-menu]').isVisible()) && await page.evaluate(() => document.activeElement.hasAttribute('data-menu-open')), 'mobile : Échap ferme le menu et rend le focus');
    await page.click('[data-menu-open]');
    await page.waitForSelector('[data-mobile-menu].is-open');
    await page.click('[data-menu-close]');
    await page.waitForTimeout(400);
    ok(!(await page.locator('[data-mobile-menu]').isVisible()), 'mobile : bouton de fermeture du menu');
    await page.click('[data-menu-open]');
    await page.locator('[data-mobile-menu] nav a', { hasText: 'Tarifs' }).click();
    await page.waitForLoadState('domcontentloaded');
    ok((await page.locator('h1').textContent()).trim() === 'Tarifs', 'mobile : lien du menu → page Tarifs');
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 600));
    const bar = page.locator('[data-mobile-bar]');
    ok(await bar.isVisible(), 'mobile : barre « Appeler / Réserver » visible');
    ok(/^tel:/.test(await bar.locator('a').first().getAttribute('href')), 'mobile : bouton « Appeler »');
    await bar.locator('a', { hasText: 'Réserver' }).click();
    await page.waitForSelector('[data-tp-booking]');
    ok(!(await page.locator('[data-mobile-bar]').isVisible()), 'mobile : barre masquée sur la réservation (remplacée par la barre de prix)');
    await page.context().close();
  }

  /* ================================================================== */
  /* 3. Clics : accueil et pages de contenu                              */
  /* ================================================================== */
  {
    const page = await newPage({ width: 1440, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    // Héros
    await page.locator('.hero .btn-row a').first().click();
    await page.waitForSelector('[data-tp-booking]');
    ok(/view=reservation/.test(page.url()), 'héros : « Réserver un taxi » → réservation');
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok(/^tel:/.test(await page.locator('.hero .btn--secondary').getAttribute('href')), 'héros : bouton d\'appel');
    // Services : chaque carte présélectionne sa prestation
    const services = await page.locator('.section-services .card .link-arrow').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    for (const href of services) {
      const code = new URL(href, BASE).searchParams.get('tp_service');
      await page.goto(BASE + href, { waitUntil: 'networkidle' });
      const checked = await page.locator('[data-tp-services] input:checked').getAttribute('value');
      ok(checked === code, `services : « Réserver » ${code} → prestation présélectionnée`, checked);
    }
    // Véhicules : chaque carte présélectionne son véhicule
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const vehicles = await page.locator('.section-fleet .card .link-arrow').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    for (const href of vehicles) {
      const code = new URL(href, BASE).searchParams.get('tp_vehicle');
      await page.goto(BASE + href, { waitUntil: 'networkidle' });
      const st = await page.evaluate(() => document.querySelector('[data-tp-booking]').__tpBooking.state.vehicleId);
      ok(st === code, `véhicules : « Réserver ce véhicule » ${code} → véhicule présélectionné`, st);
    }
    // Liens d'en-tête de section
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    for (const [label, h1] of [['Tous nos services', 'Nos services'], ['Voir la flotte', 'Nos véhicules']]) {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await page.locator('.section-head__row .link-arrow', { hasText: label }).click();
      await page.waitForLoadState('domcontentloaded');
      ok((await page.locator('h1').textContent()).trim() === h1, `accueil : « ${label} » → ${h1}`);
    }
    // Zones : carte à la demande et bouton
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.section-zones [data-map-load]').click();
    ok(await page.locator('.section-zones .map-frame iframe').count() === 1, 'zones : « Afficher la carte » charge la carte');
    await page.locator('.section-zones .btn', { hasText: 'Calculer' }).click();
    await page.waitForSelector('[data-tp-booking]');
    ok(true, 'zones : « Calculer mon trajet » → réservation');
    // FAQ
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const second = page.locator('.section-faq details').nth(1);
    await second.locator('summary').click();
    ok(await second.evaluate((d) => d.open) && !(await page.locator('.section-faq details').first().evaluate((d) => d.open)), 'FAQ : une question s\'ouvre et referme la précédente');
    await page.locator('.section-faq a.btn', { hasText: 'Nous contacter' }).click();
    await page.waitForLoadState('domcontentloaded');
    ok((await page.locator('h1').textContent()).trim() === 'Contact', 'FAQ : « Nous contacter » → page Contact');
    // Appel à l'action
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.section-cta .btn', { hasText: 'Réserver en ligne' }).click();
    await page.waitForSelector('[data-tp-booking]');
    ok(true, 'appel à l\'action : « Réserver en ligne » → réservation');
    // Sections désactivées par défaut (avis, chiffres) : boutons testés en les activant
    await page.goto(BASE + '/?enable_all=1', { waitUntil: 'networkidle' });
    const track = page.locator('[data-slider-track]');
    await page.locator('[data-slider-next]').click();
    await page.waitForTimeout(700);
    const moved = await track.evaluate((t) => t.scrollLeft);
    await page.locator('[data-slider-prev]').click();
    await page.waitForTimeout(700);
    ok(moved > 0 && (await track.evaluate((t) => t.scrollLeft)) < moved, 'avis clients : boutons suivant et précédent du carrousel');
    await page.locator('.section-stats').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    ok((await page.locator('.stat__value').first().textContent()).trim() === '15 ans', 'chiffres clés : compteur animé jusqu\'à la valeur');
    // Page 404
    await page.goto(BASE + '/nope', { waitUntil: 'domcontentloaded' });
    await page.locator('.empty-state .btn', { hasText: 'Réserver' }).click();
    await page.waitForSelector('[data-tp-booking]');
    ok(true, 'page 404 : « Réserver un taxi » → réservation');
    // Recherche
    await page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await page.fill('#Search-input', 'taxi');
    await page.click('.search-form button');
    await page.waitForLoadState('domcontentloaded');
    ok(/\/search\?q=taxi/.test(page.url()), 'recherche : envoi du formulaire');
    await page.context().close();
  }

  /* ================================================================== */
  /* 4. Formulaire de contact                                            */
  /* ================================================================== */
  {
    const page = await newPage({ width: 1440, height: 900 });
    await page.goto(BASE + '/?view=contact', { waitUntil: 'networkidle' });
    const returnTo = await page.locator('#ContactForm [name="return_to"]').inputValue();
    ok(returnTo === '/?view=contact&contact_posted=true', 'contact : retour prévu sur la page Contact après envoi', returnTo);
    await page.fill('#ContactForm-name', 'Test');
    await page.fill('#ContactForm-email', 'test@example.com');
    await page.fill('#ContactForm-body', 'Bonjour');
    await Promise.all([page.waitForNavigation(), page.click('#ContactForm [type="submit"]')]);
    ok(await visible(page, '[data-contact-success]'), 'contact : message « envoyé » affiché après l\'envoi');
    const sent = await (await fetch(`${BASE}/__contact`)).json();
    ok(sent.some((m) => m['contact[email]'] === 'test@example.com'), 'contact : message transmis au formulaire Shopify');
    await page.goto(BASE + '/?contact_posted=true', { waitUntil: 'load' });
    await page.waitForTimeout(200);
    ok(await visible(page, '.contact-banner'), 'contact : confirmation affichée même si Shopify renvoie vers l\'accueil');
    await page.evaluate(() => sessionStorage.setItem('tp-contact-sent', JSON.stringify({ ref: 'TP-TEST', name: 'Léa' })));
    await page.goto(BASE + '/?contact_posted=true', { waitUntil: 'load' });
    await page.waitForTimeout(200);
    ok(await visible(page, '.tp-banner:not(.contact-banner)') && await page.locator('.tp-banner').count() === 1, 'réservation : confirmation affichée (une seule fois) même si Shopify renvoie vers l\'accueil');
    const privacy = await page.goto(BASE + '/?view=contact', { waitUntil: 'domcontentloaded' }).then(() => page.locator('#ContactForm a').first().getAttribute('href'));
    ok(privacy === '/policies/privacy-policy', 'contact : lien vers la politique de confidentialité Shopify', privacy);
    await page.context().close();
  }

  /* ================================================================== */
  /* 5. Réservation : chaque bouton                                       */
  /* ================================================================== */
  {
    const page = await newPage({ width: 1440, height: 1000 }, { permissions: ['geolocation'], geolocation: { latitude: 50.827, longitude: 4.36 } });
    await page.goto(BASE + '/?view=reservation', { waitUntil: 'networkidle' });
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(BASE + '/?view=reservation', { waitUntil: 'networkidle' });
    const B = '[data-tp-booking]';
    // Bouton « Utiliser ma position »
    await page.click(`${B} [data-tp-address="pickup"] [data-tp-locate]`);
    await page.waitForFunction(() => document.querySelector('[data-tp-address="pickup"] input').value.includes('Avenue Louise'));
    ok(true, 'réservation : « Utiliser ma position » remplit l\'adresse de départ');
    // Arrivée, inversion
    await page.fill(`${B} [data-tp-address="dropoff"] input`, 'Brussels Airport');
    await page.locator(`${B} [data-tp-address="dropoff"] [role="option"]`).first().click();
    await page.waitForSelector(`${B} .tp-route__facts`);
    await page.click(`${B} [data-tp-swap]`);
    const swapped = [await page.inputValue(`${B} [data-tp-address="pickup"] input`), await page.inputValue(`${B} [data-tp-address="dropoff"] input`)];
    ok(swapped[0].includes('Brussels Airport') && swapped[1].includes('Avenue Louise'), 'réservation : bouton d\'inversion départ / arrivée');
    await page.click(`${B} [data-tp-swap]`);
    // Quand ? Dès que possible / Programmer
    await page.locator(`${B} .tp-segmented label`, { hasText: 'Dès que possible' }).click();
    ok(await page.locator(`${B} [data-tp-schedule]`).isHidden(), 'réservation : « Dès que possible » masque la date');
    await page.locator(`${B} .tp-segmented label`, { hasText: 'Programmer' }).click();
    ok(await page.locator(`${B} [data-tp-schedule]`).isVisible(), 'réservation : « Programmer » affiche la date');
    const day = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    await page.fill(`${B} [name="date"]`, day); await page.dispatchEvent(`${B} [name="date"]`, 'change');
    await page.fill(`${B} [name="time"]`, '14:00'); await page.dispatchEvent(`${B} [name="time"]`, 'change');
    // Quantités
    await page.click(`${B} [data-tp-stepper="passengers"] [data-tp-inc]`);
    await page.click(`${B} [data-tp-stepper="passengers"] [data-tp-inc]`);
    await page.click(`${B} [data-tp-stepper="passengers"] [data-tp-dec]`);
    await page.click(`${B} [data-tp-stepper="luggage"] [data-tp-inc]`);
    ok(await page.inputValue(`${B} [name="passengers"]`) === '2' && await page.inputValue(`${B} [name="luggage"]`) === '1', 'réservation : boutons + et − des passagers et bagages');
    // Aller-retour
    await page.check(`${B} [name="roundTrip"]`);
    ok(await page.locator(`${B} [data-tp-return]`).isVisible(), 'réservation : interrupteur aller-retour affiche le retour');
    await page.uncheck(`${B} [name="roundTrip"]`);
    // Prestations : mise à disposition affiche la durée
    await page.locator(`${B} .tp-chip`, { hasText: 'Mise à disposition' }).click();
    ok(await page.locator(`${B} [data-tp-hours-field]`).isVisible(), 'réservation : prestation « Mise à disposition » affiche la durée');
    await page.locator(`${B} .tp-chip`, { hasText: 'Taxi classique' }).click();
    // Étapes, boutons Continuer / Retour et barre de progression
    await page.click(`${B} .tp-nav [data-tp-next]`);
    await page.locator(`${B} .tp-vehicle`).first().click();
    await page.click(`${B} .tp-nav [data-tp-next]`);
    ok(await page.locator(`${B} [data-tp-step="3"]`).isVisible(), 'réservation : « Continuer » passe aux options');
    await page.click(`${B} .tp-nav [data-tp-back]`);
    ok(await page.locator(`${B} [data-tp-step="2"]`).isVisible(), 'réservation : « Retour » revient à l\'étape précédente');
    await page.click(`${B} [data-tp-progress] [data-tp-goto="1"]`);
    ok(await page.locator(`${B} [data-tp-step="1"]`).isVisible(), 'réservation : la barre de progression ramène à une étape terminée');
    await page.click(`${B} .tp-nav [data-tp-next]`);
    await page.click(`${B} .tp-nav [data-tp-next]`);
    // Options : case et quantités
    await page.locator(`${B} [data-option-check="siege-bebe"]`).check();
    await page.click(`${B} [data-option-stepper="rehausseur"] [data-tp-inc]`);
    await page.click(`${B} [data-option-stepper="rehausseur"] [data-tp-inc]`);
    await page.click(`${B} [data-option-stepper="rehausseur"] [data-tp-dec]`);
    const opts = await page.evaluate(() => document.querySelector('[data-tp-booking]').__tpBooking.state.options);
    ok(opts['siege-bebe'] === 1 && opts.rehausseur === 1, 'réservation : options (case à cocher et quantité + / −)', JSON.stringify(opts));
    await page.click(`${B} .tp-nav [data-tp-next]`);
    await page.fill(`${B} [name="firstName"]`, 'Léa'); await page.fill(`${B} [name="lastName"]`, 'Martin');
    await page.fill(`${B} [name="email"]`, 'lea@example.com'); await page.fill(`${B} [name="phone"]`, '+32 470 12 34 56');
    await page.locator(`${B} .tp-pay input[value="driver"]`).check();
    const termsLink = await page.locator(`${B} .tp-terms a`).first().getAttribute('href');
    ok(termsLink === '/policies/terms-of-service', 'réservation : case des conditions liée aux conditions Shopify', termsLink);
    await page.check(`${B} [name="terms"]`);
    await page.click(`${B} .tp-nav [data-tp-next]`);
    ok(/paiement au chauffeur/i.test(await page.locator(`${B} [data-tp-confirm]`).textContent()), 'réservation : bouton de confirmation adapté au mode de règlement');
    // Boutons « Modifier » du récapitulatif
    const editTargets = await page.locator(`${B} [data-tp-summary] [data-goto]`).evaluateAll((bs) => bs.map((b) => b.getAttribute('data-goto')));
    for (const n of [...new Set(editTargets)]) {
      await page.locator(`${B} [data-tp-summary] [data-goto="${n}"]`).first().click();
      ok(await page.locator(`${B} [data-tp-step="${n}"]`).isVisible(), `récapitulatif : « Modifier » → étape ${n}`);
      for (let i = Number(n); i < 5; i++) await page.click(`${B} .tp-nav [data-tp-next]`);
    }
    // Envoi, puis « Nouvelle réservation »
    await Promise.all([page.waitForNavigation(), page.click(`${B} [data-tp-confirm]`)]);
    await page.waitForSelector(`${B} .tp-result`);
    await page.click(`${B} [data-tp-new]`);
    ok(await page.locator(`${B} [data-tp-step="1"]`).isVisible() && (await page.inputValue(`${B} [data-tp-address="pickup"] input`)) === '', 'réservation : « Nouvelle réservation » remet le formulaire à zéro');
    ok(page.__errors.length === 0, 'réservation : aucune erreur JavaScript pendant tous les clics', page.__errors.join(' | '));
    await page.context().close();
  }
} finally {
  await browser.close();
  preview.server.close();
}
console.log(`\n${failures.length ? `✗ ${failures.length} échec(s)` : '✓ Tous les liens et boutons fonctionnent'}`);
process.exit(failures.length ? 1 : 0);
