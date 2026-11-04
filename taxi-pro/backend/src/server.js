// Service de réservation TAXI PRO — serveur HTTP (Node 18+, sans dépendance).
//
//   GET  /health                               état du service
//   POST /api/route                            itinéraire calculé côté serveur
//   POST /api/quote                            devis recalculé (tous véhicules)
//   POST /api/bookings                         création d'une réservation (prix revalidé)
//   GET  /api/bookings/:id?token=              statut public d'une réservation
//   GET  /api/bookings/:id/ics?token=          fichier agenda du client
//   POST /webhooks/shopify/:tenant             paiement Shopify (orders/paid), signature HMAC
//   POST /webhooks/stripe/:tenant              paiement Stripe (checkout.session.completed), signature
//   GET  /admin                                tableau de bord (jeton administrateur)
//   GET  /admin/api/bookings                   liste ; POST /admin/api/bookings/:id/:action (confirm|cancel|complete|update)
//   GET  /admin/calendar.ics?tenant=&token=    flux d'agenda (Google Agenda, Outlook, Apple Calendrier)
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig, findTenant } from './config.js';
import { createStore } from './store.js';
import { createService, HttpError } from './bookings.js';
import { createRateLimiter, safeEqual, log } from './util.js';

const here = dirname(fileURLToPath(import.meta.url));
const MAX_BODY = 64 * 1024;

export function createApp({ config = loadConfig(), fetchImpl = fetch, clock } = {}) {
  const store = createStore(config.dataDir);
  const service = createService({ config, store, fetchImpl, clock });
  const allow = createRateLimiter();
  const adminHtml = readFileSync(join(here, 'admin.html'), 'utf8');

  const json = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
  };
  const ipOf = (req) => (config.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';
  const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new HttpError(413, { error: 'Requête trop volumineuse' })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  const parseJson = (text) => { try { return JSON.parse(text || '{}'); } catch (e) { throw new HttpError(400, { error: 'JSON invalide' }); } };

  function cors(req, res, tenantHint) {
    const origin = req.headers.origin;
    if (!origin) return true;
    const tenants = tenantHint ? [tenantHint] : config.tenants;
    const ok = tenants.some((t) => t.allowedOrigins.includes(origin));
    if (ok) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    return ok;
  }
  function adminTenant(req, url) {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('token');
    const tenant = findTenant(config, url.searchParams.get('tenant'));
    if (!tenant || !tenant.adminToken || !safeEqual(token, tenant.adminToken)) throw new HttpError(401, { error: 'Accès refusé' });
    return tenant;
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const ip = ipOf(req);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if (req.method === 'OPTIONS') {
      cors(req, res);
      res.writeHead(204); res.end(); return;
    }
    if (path === '/health') return json(res, 200, { ok: true, tenants: config.tenants.map((t) => t.id), time: new Date().toISOString() });

    /* ---------- API publique (appelée par le thème) ---------- */
    if (path.startsWith('/api/')) {
      if (!cors(req, res) && req.headers.origin) return json(res, 403, { error: 'Origine non autorisée' });
      if (req.method === 'POST') {
        const body = parseJson(await readBody(req));
        const tenant = findTenant(config, body.shop);
        if (!tenant) return json(res, 404, { error: 'Boutique inconnue' });
        if (req.headers.origin && !tenant.allowedOrigins.includes(req.headers.origin)) return json(res, 403, { error: 'Origine non autorisée' });
        if (path === '/api/route') {
          if (!allow(`route:${ip}`, 60, 60000)) return json(res, 429, { error: 'Trop de requêtes' });
          return json(res, 200, await service.route(tenant, body));
        }
        if (path === '/api/quote') {
          if (!allow(`quote:${ip}`, 60, 60000)) return json(res, 429, { error: 'Trop de requêtes' });
          return json(res, 200, await service.quote(tenant, body));
        }
        if (path === '/api/bookings') {
          if (!allow(`booking:${ip}`, 8, 10 * 60000)) return json(res, 429, { error: 'Trop de réservations en peu de temps. Appelez-nous.' });
          return json(res, 201, await service.createBooking(tenant, body));
        }
      }
      const m = /^\/api\/bookings\/([A-Za-z0-9_-]{6,40})(\/ics)?$/.exec(path);
      if (req.method === 'GET' && m) {
        if (!allow(`status:${ip}`, 120, 60000)) return json(res, 429, { error: 'Trop de requêtes' });
        const tenant = findTenant(config, url.searchParams.get('shop')) || config.tenants.find((t) => store.get(t.id, m[1]));
        if (!tenant) return json(res, 404, { error: 'Réservation introuvable' });
        if (m[2]) {
          const ics = await service.ics(tenant, m[1], url.searchParams.get('token'));
          res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="reservation.ics"', 'Cache-Control': 'no-store' });
          res.end(ics); return;
        }
        return json(res, 200, service.getPublic(tenant, m[1], url.searchParams.get('token')));
      }
      return json(res, 404, { error: 'Introuvable' });
    }

    /* ---------- Webhooks de paiement (corps brut, signature vérifiée) ---------- */
    const wh = /^\/webhooks\/(shopify|stripe)\/([a-z0-9-]+)$/.exec(path);
    if (req.method === 'POST' && wh) {
      const tenant = findTenant(config, wh[2]);
      if (!tenant) return json(res, 404, { error: 'Client inconnu' });
      const raw = await readBody(req);
      const result = wh[1] === 'shopify' ? await service.shopifyWebhook(tenant, raw, req.headers) : await service.stripeWebhook(tenant, raw, req.headers);
      return json(res, 200, result);
    }

    /* ---------- Administration ---------- */
    if (path === '/admin') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'" });
      res.end(adminHtml); return;
    }
    if (path === '/admin/calendar.ics') {
      const tenant = adminTenant(req, url);
      res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(await service.adminCalendar(tenant)); return;
    }
    if (path.startsWith('/admin/api/')) {
      if (!allow(`admin:${ip}`, 300, 60000)) return json(res, 429, { error: 'Trop de requêtes' });
      const tenant = adminTenant(req, url);
      if (req.method === 'GET' && path === '/admin/api/bookings') return json(res, 200, { tenant: tenant.id, bookings: service.adminList(tenant) });
      const am = /^\/admin\/api\/bookings\/([A-Za-z0-9_-]{6,40})\/(confirm|cancel|complete|update)$/.exec(path);
      if (req.method === 'POST' && am) return json(res, 200, { booking: await service.adminAction(tenant, am[1], am[2], parseJson(await readBody(req))) });
      if (req.method === 'POST' && path === '/admin/api/reminders') return json(res, 200, { sent: await service.runReminders() });
      return json(res, 404, { error: 'Introuvable' });
    }
    return json(res, 404, { error: 'Introuvable' });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => {
      if (e instanceof HttpError) return json(res, e.status, e.body);
      log('error', 'erreur interne', { error: e.message, stack: e.stack });
      json(res, 500, { error: 'Erreur interne' });
    });
  });
  return { server, service, store, config };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  if (!config.tenants.length) {
    console.error('Aucun client configuré : définissez TENANTS_FILE ou SHOP_DOMAIN / STOREFRONT_URL (voir .env.example).');
    process.exit(1);
  }
  const { server, service } = createApp({ config });
  server.listen(config.port, config.host, () => log('info', `TAXI PRO backend à l'écoute sur ${config.host}:${config.port}`, { tenants: config.tenants.map((t) => t.id) }));
  const every = Number(process.env.REMINDER_INTERVAL_MINUTES || 5) * 60000;
  setInterval(() => service.runReminders().catch((e) => log('error', 'rappels', { error: e.message })), every).unref();
}
