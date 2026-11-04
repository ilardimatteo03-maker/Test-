// Tests du service de réservation : node --test taxi-pro/backend/test
// Les services externes (Stripe, Shopify, e-mails) sont simulés ; l'itinéraire utilise le fournisseur
// « estimate » (déterministe). La configuration provient du même fichier que les tests du moteur.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createApp } from '../src/server.js';
import { normalizeTenant } from '../src/config.js';
import { outbox } from '../src/email.js';
import { parseConfigHtml, clearConfigCache } from '../src/storefront.js';
import { estimateRoute, clearRouteCache } from '../src/routing.js';
import { decodePolyline } from '../src/util.js';
import { verifyStripeWebhook } from '../src/payments/stripe.js';
import { localToUtc } from '../src/ics.js';
import Pricing from '../src/pricing.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');
const NOW = new Date('2026-11-04T10:00:00Z');
const ORIGIN = 'https://www.taxi-test.be';
const PTS = { ixelles: { lat: 50.827, lng: 4.36, label: 'Avenue Louise 200, Ixelles' }, uccle: { lat: 50.8, lng: 4.34, label: 'Uccle' }, leuven: { lat: 50.8798, lng: 4.7005, label: 'Leuven' } };

let base, app, dir, external = [];
const STRIPE_WH = 'whsec_test_secret';
const SHOPIFY_WH = 'shopify_test_secret';

function fixtureConfig() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'config.json'), 'utf8'));
  raw.settings.language = 'fr';
  raw.settings.company = { name: 'Taxi Test', phone: '+32 2 000 00 00', email: 'contact@taxi-test.be', address: 'Rue Test 1, 1000 Bruxelles', colors: { accent: '#C8A35A', accentText: '#0B0B0C' } };
  return raw;
}

async function fakeFetch(url, init = {}) {
  const u = String(url);
  external.push({ url: u, init });
  const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (u.startsWith('https://api.stripe.com/v1/checkout/sessions')) return ok({ id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' });
  if (u.includes('/admin/api/') && u.endsWith('/graphql.json')) return ok({ data: { draftOrderCreate: { draftOrder: { id: 'gid://shopify/DraftOrder/1', invoiceUrl: 'https://taxi-shopify.myshopify.com/invoices/abc' }, userErrors: [] } } });
  if (u.startsWith('https://hooks.example.com')) return ok({ ok: true });
  return new Response('not mocked', { status: 599 });
}

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'taxipro-'));
  const cfgFile = join(dir, 'config.json');
  writeFileSync(cfgFile, JSON.stringify(fixtureConfig()));
  const common = { configFile: cfgFile, allowedOrigins: [ORIGIN], routing: { provider: 'estimate', roadFactor: 1.3 }, email: { provider: 'memory', adminEmail: 'planning@taxi-test.be', from: 'Taxi Test <resa@taxi-test.be>' }, adminToken: 'admin-secret-token' };
  const config = {
    port: 0, host: '127.0.0.1', publicUrl: 'https://resa.taxi-test.be', dataDir: join(dir, 'data'), configCacheSeconds: 60, trustProxy: true,
    tenants: [
      normalizeTenant({ id: 'basic', shopDomain: 'taxi-basic.myshopify.com', ...common }),
      normalizeTenant({ id: 'stripe-shop', shopDomain: 'taxi-stripe.myshopify.com', ...common, payments: { provider: 'stripe', stripeSecretKey: 'sk_test_x', stripeWebhookSecret: STRIPE_WH }, webhookUrl: 'https://hooks.example.com/taxi', webhookSecret: 'out-secret' }),
      normalizeTenant({ id: 'shopify-shop', shopDomain: 'taxi-shopify.myshopify.com', ...common, payments: { provider: 'shopify', shopifyAdminToken: 'shpat_test', shopifyWebhookSecret: SHOPIFY_WH } })
    ]
  };
  app = createApp({ config, fetchImpl: fakeFetch, clock: () => NOW });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${app.server.address().port}`;
});
after(() => { app.server.close(); clearConfigCache(); clearRouteCache(); });

let ipCounter = 1;
function call(path, { method = 'GET', body, headers = {}, raw } = {}) {
  return fetch(base + path, {
    method, body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'X-Forwarded-For': `10.0.0.${ipCounter++ % 250}`, ...headers }
  });
}
function expectedTotal(req) {
  const route = estimateRoute(req.pickup, req.dropoff, 1.3);
  return Pricing.quote(fixtureConfig(), { ...req, route: { distanceKm: route.distanceKm, durationMin: route.durationMin, estimated: true } }, { now: NOW });
}
const baseReq = () => ({ serviceId: 'taxi', vehicleId: 'berline', pickup: PTS.ixelles, dropoff: PTS.leuven, datetime: '2026-11-10T14:00', passengers: 2, luggage: 1, options: { 'siege-bebe': 1 } });
const customer = { firstName: 'Léa', lastName: 'Martin', email: 'lea@example.com', phone: '+32 470 12 34 56', comments: 'Code 1234' };

test('santé du service', async () => {
  const r = await call('/health');
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).tenants, ['basic', 'stripe-shop', 'shopify-shop']);
});

test('le moteur du backend est une copie exacte de celui du thème', () => {
  assert.equal(readFileSync(join(ROOT, 'backend', 'src', 'vendor', 'tp-pricing.js'), 'utf8'), readFileSync(join(ROOT, 'theme', 'assets', 'tp-pricing.js'), 'utf8'));
});

test('devis serveur : itinéraire calculé par le serveur, prix par véhicule', async () => {
  const r = await call('/api/quote', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq() } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.route.provider, 'estimate');
  assert.equal(d.quote.total, expectedTotal(baseReq()).total);
  assert.equal(d.vehicles.length, 4);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
});

test('origine non autorisée refusée', async () => {
  const r = await call('/api/quote', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq() }, headers: { Origin: 'https://evil.example' } });
  assert.equal(r.status, 403);
});

test('demande de réservation : prix revalidé, statut « en attente », e-mails client et entreprise', async () => {
  outbox.length = 0;
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'request', clientTotal: exp.total, locale: 'fr' } });
  assert.equal(r.status, 201, await r.clone().text());
  const d = await r.json();
  assert.equal(d.booking.status, 'pending_validation');
  assert.match(d.booking.ref, /^TP-\d{6}-[A-Z2-9]{5}$/);
  assert.equal(d.paymentUrl, null);
  assert.equal(outbox.length, 2);
  const toCustomer = outbox.find((m) => m.to.includes('lea@example.com'));
  assert.match(toCustomer.subject, /Demande de réservation TP-/);
  assert.match(toCustomer.html, /pas encore confirmée/);
  assert.ok(outbox.find((m) => m.to.includes('planning@taxi-test.be')));
  // Statut public avec le jeton, refusé sans
  const s = await call(`/api/bookings/${d.booking.id}?token=${d.booking.token}`);
  assert.equal((await s.json()).booking.status, 'pending_validation');
  assert.equal((await call(`/api/bookings/${d.booking.id}?token=faux`)).status, 404);
});

test('prix falsifié par le navigateur : 409 avec le prix serveur, puis acceptation explicite', async () => {
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'driver', clientTotal: 1 } });
  assert.equal(r.status, 409);
  const d = await r.json();
  assert.equal(d.code, 'PRICE_CHANGED');
  assert.equal(d.quote.total, exp.total);
  const r2 = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'driver', clientTotal: 1, acceptTotal: d.quote.total } });
  assert.equal(r2.status, 201);
});

test('validations : e-mail, délai minimum, véhicule inconnu, champ piège', async () => {
  const send = (over) => call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'request', clientTotal: expectedTotal(baseReq()).total, ...over } });
  assert.equal((await send({ customer: { ...customer, email: 'pas-un-email' } })).status, 422);
  const late = await send({ request: { ...baseReq(), datetime: '2026-11-04T11:20' } });
  assert.equal(late.status, 422);
  assert.ok((await late.json()).errors.some((e) => e.code === 'LEAD_TIME'));
  const veh = await send({ request: { ...baseReq(), vehicleId: 'fusee' } });
  assert.ok((await veh.json()).errors.some((e) => e.code === 'VEHICLE_UNKNOWN'));
  assert.equal((await send({ website: 'http://spam' })).status, 400);
});

test('adresse sans coordonnées : demande acceptée sur devis, paiement en ligne refusé', async () => {
  const req = { ...baseReq(), pickup: { label: 'Rue inconnue 1' }, dropoff: { label: 'Ailleurs' } };
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-stripe.myshopify.com', request: req, customer, payment: 'request', clientTotal: null } });
  assert.equal(r.status, 201);
  const r2 = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-stripe.myshopify.com', request: req, customer, payment: 'online', clientTotal: null } });
  assert.equal(r2.status, 422);
});

test('mode de paiement non activé ou non configuré : refusé', async () => {
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'online', clientTotal: exp.total } });
  assert.equal(r.status, 422);
});

function stripeSig(payload, secret = STRIPE_WH, t = Math.floor(Date.now() / 1000)) {
  return `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
}

test('paiement en ligne Stripe : lien de paiement, confirmation uniquement par webhook signé', async () => {
  outbox.length = 0; external = [];
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-stripe.myshopify.com', request: baseReq(), customer, payment: 'online', clientTotal: exp.total, returnUrl: `${ORIGIN}/pages/reservation?x=1` } });
  assert.equal(r.status, 201, await r.clone().text());
  const d = await r.json();
  assert.equal(d.booking.status, 'awaiting_payment');
  assert.equal(d.paymentUrl, 'https://checkout.stripe.com/c/pay/cs_test_123');
  const stripeCall = external.find((x) => x.url.includes('api.stripe.com'));
  const form = new URLSearchParams(stripeCall.init.body);
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), String(Math.round(exp.total * 100)));
  assert.equal(form.get('metadata[booking_id]'), d.booking.id);
  assert.equal(form.get('success_url'), `${ORIGIN}/pages/reservation?tp_booking=${d.booking.id}&tp_token=${d.booking.token}`);
  assert.ok(outbox.some((m) => /paiement en attente/i.test(m.subject)));

  const event = (amount) => JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_123', payment_status: 'paid', amount_total: amount, currency: 'eur', metadata: { booking_id: d.booking.id } } } });
  const bad = await call('/webhooks/stripe/stripe-shop', { method: 'POST', raw: event(Math.round(exp.total * 100)), headers: { 'Stripe-Signature': stripeSig('autre') } });
  assert.equal(bad.status, 401);
  const statusBefore = await (await call(`/api/bookings/${d.booking.id}?token=${d.booking.token}`)).json();
  assert.equal(statusBefore.booking.status, 'awaiting_payment');

  // Montant insuffisant : pas de confirmation
  const low = event(100);
  await call('/webhooks/stripe/stripe-shop', { method: 'POST', raw: low, headers: { 'Stripe-Signature': stripeSig(low) } });
  assert.equal((await (await call(`/api/bookings/${d.booking.id}?token=${d.booking.token}`)).json()).booking.status, 'awaiting_payment');

  outbox.length = 0; external = [];
  const good = event(Math.round(exp.total * 100));
  const ok = await call('/webhooks/stripe/stripe-shop', { method: 'POST', raw: good, headers: { 'Stripe-Signature': stripeSig(good) } });
  assert.equal(ok.status, 200);
  assert.equal((await (await call(`/api/bookings/${d.booking.id}?token=${d.booking.token}`)).json()).booking.status, 'confirmed');
  const conf = outbox.find((m) => m.to.includes('lea@example.com'));
  assert.match(conf.subject, /confirmée/);
  assert.equal(conf.attachments[0].filename.endsWith('.ics'), true);
  assert.match(conf.attachments[0].content, /BEGIN:VEVENT/);
  const hook = external.find((x) => x.url.startsWith('https://hooks.example.com'));
  assert.ok(hook, 'webhook sortant envoyé');
  assert.equal(hook.init.headers['X-TaxiPro-Signature'], crypto.createHmac('sha256', 'out-secret').update(hook.init.body).digest('hex'));
  // Webhook rejoué : idempotent
  outbox.length = 0;
  await call('/webhooks/stripe/stripe-shop', { method: 'POST', raw: good, headers: { 'Stripe-Signature': stripeSig(good) } });
  assert.equal(outbox.length, 0);
});

test('acompte : montant dû = pourcentage du total', async () => {
  external = [];
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-stripe.myshopify.com', request: baseReq(), customer, payment: 'deposit', clientTotal: exp.total, returnUrl: `${ORIGIN}/pages/reservation` } });
  assert.equal(r.status, 201);
  const form = new URLSearchParams(external.find((x) => x.url.includes('api.stripe.com')).init.body);
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), String(Math.round(exp.deposit * 100)));
});

test('paiement Shopify : commande provisoire au prix serveur, confirmation par webhook orders/paid', async () => {
  external = [];
  const exp = expectedTotal(baseReq());
  const r = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-shopify.myshopify.com', request: baseReq(), customer, payment: 'online', clientTotal: exp.total } });
  assert.equal(r.status, 201, await r.clone().text());
  const d = await r.json();
  assert.equal(d.paymentUrl, 'https://taxi-shopify.myshopify.com/invoices/abc');
  const gql = JSON.parse(external.find((x) => x.url.endsWith('/graphql.json')).init.body);
  assert.equal(gql.variables.input.lineItems[0].originalUnitPriceWithCurrency.amount, exp.total.toFixed(2));
  assert.equal(gql.variables.input.customAttributes[0].value, d.booking.id);
  const order = JSON.stringify({ id: 99, name: '#1001', financial_status: 'paid', total_price: exp.total.toFixed(2), currency: 'EUR', note_attributes: [{ name: 'taxipro_booking_id', value: d.booking.id }] });
  const sig = crypto.createHmac('sha256', SHOPIFY_WH).update(order).digest('base64');
  assert.equal((await call('/webhooks/shopify/shopify-shop', { method: 'POST', raw: order, headers: { 'X-Shopify-Hmac-Sha256': 'faux', 'X-Shopify-Topic': 'orders/paid' } })).status, 401);
  const ok = await call('/webhooks/shopify/shopify-shop', { method: 'POST', raw: order, headers: { 'X-Shopify-Hmac-Sha256': sig, 'X-Shopify-Topic': 'orders/paid' } });
  assert.equal(ok.status, 200);
  assert.equal((await (await call(`/api/bookings/${d.booking.id}?token=${d.booking.token}`)).json()).booking.status, 'confirmed');
});

test('administration : accès protégé, confirmation, modification, annulation, agenda, rappels', async () => {
  assert.equal((await call('/admin/api/bookings?tenant=basic', { headers: { Authorization: 'Bearer mauvais' } })).status, 401);
  const auth = { Authorization: 'Bearer admin-secret-token' };
  const list = await (await call('/admin/api/bookings?tenant=basic', { headers: auth })).json();
  const pending = list.bookings.find((b) => b.status === 'pending_validation' && b.request.pickup.lat);
  assert.ok(pending);
  outbox.length = 0;
  const c = await call(`/admin/api/bookings/${pending.id}/confirm?tenant=basic`, { method: 'POST', body: {}, headers: auth });
  assert.equal((await c.json()).booking.status, 'confirmed');
  assert.ok(outbox.some((m) => /confirmée/.test(m.subject) && m.attachments));
  // Une réservation confirmée ne peut pas être reconfirmée
  assert.equal((await call(`/admin/api/bookings/${pending.id}/confirm?tenant=basic`, { method: 'POST', body: {}, headers: auth })).status, 409);
  // Modification de l'heure : nuit → prix recalculé et e-mail de modification
  outbox.length = 0;
  const u = await (await call(`/admin/api/bookings/${pending.id}/update?tenant=basic`, { method: 'POST', body: { datetime: '2026-11-10T23:00', adminNote: 'Chauffeur : Marc' }, headers: auth })).json();
  assert.equal(u.booking.quote.datetime, '2026-11-10T23:00');
  assert.ok(u.booking.quote.lines.some((l) => l.code === 'night'));
  assert.ok(outbox.some((m) => /modifiée/.test(m.subject)));
  // Rappel : la course a lieu dans moins de 24 h
  await call(`/admin/api/bookings/${pending.id}/update?tenant=basic`, { method: 'POST', body: { datetime: '2026-11-05T08:00', notify: false }, headers: auth });
  outbox.length = 0;
  const rem = await (await call('/admin/api/reminders?tenant=basic', { method: 'POST', body: {}, headers: auth })).json();
  assert.ok(rem.sent >= 1);
  assert.ok(outbox.some((m) => /Rappel/.test(m.subject)));
  const rem2 = await (await call('/admin/api/reminders?tenant=basic', { method: 'POST', body: {}, headers: auth })).json();
  assert.equal(rem2.sent, 0);
  // Flux d'agenda
  const cal = await call('/admin/calendar.ics?tenant=basic&token=admin-secret-token');
  const ics = await cal.text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART:20261105T070000Z/); // 08:00 à Bruxelles = 07:00 UTC en novembre
  // Annulation
  outbox.length = 0;
  const x = await (await call(`/admin/api/bookings/${pending.id}/cancel?tenant=basic`, { method: 'POST', body: {}, headers: auth })).json();
  assert.equal(x.booking.status, 'cancelled');
  assert.ok(outbox.some((m) => /annulée/.test(m.subject)));
});

test('fichier agenda du client', async () => {
  const exp = expectedTotal(baseReq());
  const d = await (await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer, payment: 'request', clientTotal: exp.total } })).json();
  const r = await call(`/api/bookings/${d.booking.id}/ics?token=${d.booking.token}`);
  assert.equal(r.headers.get('content-type'), 'text/calendar; charset=utf-8');
  assert.match(await r.text(), /DTSTART:20261110T130000Z/);
});

test('limitation du débit des réservations par adresse IP', async () => {
  let last;
  for (let i = 0; i < 10; i++) {
    last = await call('/api/bookings', { method: 'POST', body: { shop: 'taxi-basic.myshopify.com', request: baseReq(), customer: { ...customer, email: 'x' } }, headers: { 'X-Forwarded-For': '192.0.2.77' } });
  }
  assert.equal(last.status, 429);
});

test('lecture de la configuration publiée par le thème (rendu réel du modèle index.taxi-config)', async () => {
  const { createRenderer } = await import(join(ROOT, 'tools', 'preview', 'render.mjs'));
  const html = await createRenderer({ themeDir: join(ROOT, 'theme') }).render({ template: 'index.taxi-config', path: '/' });
  const raw = parseConfigHtml(html);
  assert.equal(raw.vehicles.length, 4);
  assert.equal(raw.services.length, 7);
  assert.equal(raw.settings.tariff.base, '5');
  const cfg = Pricing.normalizeConfig(raw);
  assert.equal(cfg.routes.length, 2);
  assert.equal(cfg.labels.base, 'Prise en charge');
});

test('outils : polyligne Google, signature Stripe, fuseau horaire', () => {
  assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
  const t = 1_800_000_000;
  const payload = '{"a":1}';
  const sig = `t=${t},v1=${crypto.createHmac('sha256', 'k').update(`${t}.${payload}`).digest('hex')}`;
  assert.equal(verifyStripeWebhook(payload, sig, 'k', 300, t + 10), true);
  assert.equal(verifyStripeWebhook(payload, sig, 'k', 300, t + 1000), false);
  assert.equal(localToUtc('2026-07-01T14:00', 'Europe/Brussels').toISOString(), '2026-07-01T12:00:00.000Z');
  assert.equal(localToUtc('2026-11-04T22:30', 'Europe/Brussels').toISOString(), '2026-11-04T21:30:00.000Z');
});
