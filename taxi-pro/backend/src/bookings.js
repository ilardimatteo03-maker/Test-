// Logique métier du service de réservation.
// Règle centrale : le prix est toujours recalculé ici, avec l'itinéraire calculé par le serveur et la
// configuration lue sur la boutique. Une réservation n'est « confirmée » qu'après validation par
// l'entreprise (demande, paiement au chauffeur) ou réception du paiement (webhook signé).
import { getRawConfig } from './storefront.js';
import { computeRoute, validPoint } from './routing.js';
import { normalizeConfig, quote as priceQuote, quoteVehicles, samePrice, nowLocal, toLocalString, formatMoney } from './pricing.js';
import { createShopifyPayment, verifyShopifyWebhook, parseShopifyOrder } from './payments/shopify.js';
import { createStripePayment, verifyStripeWebhook, parseStripeEvent, toMinor } from './payments/stripe.js';
import { sendEmail, renderEmail } from './email.js';
import { bookingEvent, calendar, localToUtc } from './ics.js';
import { randomToken, bookingRef, clean, isEmail, isPhone, log, hmacHex } from './util.js';

export const STATUSES = ['pending_validation', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'];

class HttpError extends Error {
  constructor(status, body) { super(body.error || body.code || String(status)); this.status = status; this.body = body; }
}
export { HttpError };

function sanitizeRequest(r = {}) {
  const pt = (p) => {
    if (!p) return null;
    if (validPoint(p)) return { lat: Number(p.lat), lng: Number(p.lng), label: clean(p.label, 300) };
    return p.label ? { label: clean(p.label, 300) } : null;
  };
  const options = {};
  Object.entries(r.options && typeof r.options === 'object' ? r.options : {}).slice(0, 30).forEach(([k, v]) => {
    const n = parseInt(v, 10);
    if (n > 0 && n < 100) options[clean(k, 60)] = n;
  });
  const int = (v, d, max) => Math.min(max, Math.max(0, parseInt(v, 10) || d));
  return {
    serviceId: clean(r.serviceId, 60), vehicleId: clean(r.vehicleId, 60),
    pickup: pt(r.pickup), dropoff: pt(r.dropoff),
    immediate: r.immediate === true, datetime: clean(r.datetime, 16),
    roundTrip: r.roundTrip === true, returnDatetime: clean(r.returnDatetime, 16),
    passengers: int(r.passengers, 1, 99), luggage: int(r.luggage, 0, 99),
    hours: Math.min(48, Math.max(0, Number(r.hours) || 0)), waitingMin: int(r.waitingMin, 0, 600), options
  };
}

function sanitizeCustomer(c = {}) {
  return {
    firstName: clean(c.firstName, 80), lastName: clean(c.lastName, 80), email: clean(c.email, 160).toLowerCase(),
    phone: clean(c.phone, 30), flight: clean(c.flight, 20).toUpperCase(), comments: clean(c.comments, 1000)
  };
}

/** Devis réduit transmis au navigateur (aucune donnée interne). */
export function publicQuote(q) {
  return {
    total: q.total, subtotal: q.subtotal, rounding: q.rounding, deposit: q.deposit, balance: q.balance, vat: q.vat, vatRate: q.vatRate,
    onRequest: q.onRequest, currency: q.currency, lines: q.lines, options: q.options, warnings: q.warnings, rules: q.rules,
    legs: q.legs.map((l) => ({ label: l.label, tripAmount: l.tripAmount, subtotal: l.subtotal, distanceKm: l.distanceKm, durationMin: l.durationMin, datetime: l.datetime })),
    distanceKm: q.distanceKm, durationMin: q.durationMin, datetime: q.datetime, returnDatetime: q.returnDatetime, roundTrip: q.roundTrip
  };
}

export function createService({ config, store, fetchImpl = fetch, clock = () => new Date() }) {
  const ROUTE_CODES = ['ROUTE_REQUIRED', 'DISTANCE_UNAVAILABLE', 'PICKUP_REQUIRED'];

  async function loadConfig(tenant) {
    const raw = await getRawConfig(tenant, { fetchImpl, cacheSeconds: config.configCacheSeconds });
    return { raw, cfg: normalizeConfig(raw) };
  }

  async function serverRoute(tenant, a, b) {
    if (!a || !b || !validPoint(a) || !validPoint(b)) return null;
    try { return await computeRoute(a, b, tenant.routing, fetchImpl); }
    catch (e) { log('warn', 'itinéraire indisponible', { tenant: tenant.id, error: e.message }); return null; }
  }

  /** Recalcule le devis d'une demande ; manualAllowed : adresse sans coordonnées acceptée (prix sur devis). */
  async function serverQuote(tenant, req, { manualAllowed = true } = {}) {
    const { raw, cfg } = await loadConfig(tenant);
    const service = cfg.services.find((s) => s.id === req.serviceId) || cfg.services[0];
    const needsRoute = !service || service.mode === 'meter';
    const route = needsRoute ? await serverRoute(tenant, req.pickup, req.dropoff) : null;
    const fullReq = { ...req, route: route ? { distanceKm: route.distanceKm, durationMin: route.durationMin, estimated: route.estimated } : {} };
    let q = priceQuote(cfg, fullReq, { now: clock() });
    if (needsRoute && !route && manualAllowed && req.pickup && (req.dropoff || (service && service.mode === 'hourly'))) {
      q.errors = q.errors.filter((e) => !ROUTE_CODES.includes(e.code));
      q.onRequest = true; q.total = null; q.lines = []; q.ok = q.errors.length === 0;
    }
    return { raw, cfg, route, q };
  }

  async function notify(tenant, raw, booking, kind, extra = {}) {
    const locale = booking.locale || (raw.settings && raw.settings.language) || 'fr';
    const jobs = [];
    const send = (to, k, opts) => {
      const m = renderEmail({ raw, booking, kind: k, locale: opts.locale || locale, extra: opts.extra || {}, forAdmin: !!opts.admin });
      jobs.push(sendEmail(tenant, { to, subject: m.subject, html: m.html, text: m.text, attachments: opts.attachments, event: k }, { fetchImpl, dataDir: config.dataDir })
        .catch((e) => log('error', 'e-mail non envoyé', { tenant: tenant.id, kind: k, error: e.message })));
    };
    const company = (raw.settings && raw.settings.company) || {};
    const ics = () => [{ filename: `${booking.ref}.ics`, contentType: 'text/calendar', content: calendar([bookingEvent(booking, { company, timeZone: normalizeConfig(raw).timezone })], company.name) }];
    const adminTo = tenant.email.adminEmail || company.email;
    const adminUrl = config.publicUrl ? `${config.publicUrl}/admin?tenant=${encodeURIComponent(tenant.id)}#${booking.id}` : '';
    const customerKinds = { request: 'request', payment: 'payment', confirmed: 'confirmed', modified: 'modified', cancelled: 'cancelled', reminder: 'reminder' };
    if (customerKinds[kind]) send(booking.customer.email, kind, { extra, attachments: kind === 'confirmed' || kind === 'modified' ? ics() : undefined });
    if (kind === 'request' || kind === 'payment') send(adminTo, 'admin', { admin: true, locale: (raw.settings && raw.settings.language) || 'fr', extra: adminUrl ? { buttonUrl: adminUrl, buttonLabel: 'Tableau de bord' } : {} });
    if (kind === 'paid') {
      send(booking.customer.email, 'confirmed', { attachments: ics() });
      send(adminTo, 'admin_paid', { admin: true, locale: (raw.settings && raw.settings.language) || 'fr' });
    }
    if (tenant.webhookUrl) {
      const body = JSON.stringify({ event: `booking.${kind}`, booking: adminView(booking), sentAt: new Date().toISOString() });
      jobs.push(fetchImpl(tenant.webhookUrl, {
        method: 'POST', body,
        headers: { 'Content-Type': 'application/json', 'X-TaxiPro-Event': `booking.${kind}`, ...(tenant.webhookSecret ? { 'X-TaxiPro-Signature': hmacHex(tenant.webhookSecret, body) } : {}) }
      }).catch((e) => log('error', 'webhook sortant en échec', { tenant: tenant.id, error: e.message })));
    }
    await Promise.all(jobs);
  }

  function adminView(b) {
    return {
      id: b.id, ref: b.ref, status: b.status, createdAt: b.createdAt, updatedAt: b.updatedAt, locale: b.locale,
      customer: b.customer, request: b.request, quote: publicQuote(b.quote), payment: { ...b.payment }, history: b.history, adminNote: b.adminNote || ''
    };
  }

  function addHistory(b, status, note) {
    b.history = b.history || [];
    b.history.push({ at: clock().toISOString(), status, note: note || '' });
    b.status = status;
    b.updatedAt = clock().toISOString();
    return b;
  }

  return {
    loadConfig,

    async route(tenant, body) {
      const a = body.from, b = body.to;
      if (!validPoint(a) || !validPoint(b)) throw new HttpError(400, { error: 'Coordonnées invalides' });
      const r = await computeRoute(a, b, tenant.routing, fetchImpl).catch((e) => { throw new HttpError(502, { error: `Itinéraire indisponible : ${e.message}` }); });
      return r;
    },

    async quote(tenant, body) {
      const req = sanitizeRequest(body.request || body);
      const { cfg, route, q } = await serverQuote(tenant, req);
      const vehicles = quoteVehicles(cfg, { ...req, route: route ? { distanceKm: route.distanceKm, durationMin: route.durationMin, estimated: route.estimated } : {} }, { now: clock() })
        .map((v) => ({ vehicleId: v.vehicle.id, fits: v.fits, total: route ? v.quote.total : null, onRequest: !route || v.quote.onRequest }));
      return { route, quote: publicQuote(q), errors: q.errors, vehicles };
    },

    async createBooking(tenant, body) {
      if (body.website) throw new HttpError(400, { error: 'Requête refusée' }); // champ piège anti-robots
      const req = sanitizeRequest(body.request);
      const customer = sanitizeCustomer(body.customer);
      const fieldErrors = [];
      if (!customer.firstName) fieldErrors.push({ code: 'FIRST_NAME', field: 'firstName', message: 'Prénom requis' });
      if (!customer.lastName) fieldErrors.push({ code: 'LAST_NAME', field: 'lastName', message: 'Nom requis' });
      if (!isEmail(customer.email)) fieldErrors.push({ code: 'EMAIL', field: 'email', message: 'Adresse e-mail invalide' });
      if (!isPhone(customer.phone)) fieldErrors.push({ code: 'PHONE', field: 'phone', message: 'Numéro de téléphone invalide' });
      if (fieldErrors.length) throw new HttpError(422, { errors: fieldErrors });

      const mode = ['request', 'driver', 'online', 'deposit'].includes(body.payment) ? body.payment : 'request';
      const { raw, cfg, route, q } = await serverQuote(tenant, req, { manualAllowed: mode === 'request' || mode === 'driver' });
      if (!q.ok) throw new HttpError(422, { errors: q.errors });

      const pay = (raw.settings.booking && raw.settings.booking.payment) || {};
      const provider = tenant.payments.provider;
      const allowed = { request: !!pay.request, driver: !!pay.driver, online: !!pay.online && !!provider, deposit: !!pay.deposit && !!provider && cfg.deposit.percent > 0 };
      if (!allowed[mode]) throw new HttpError(422, { errors: [{ code: 'PAYMENT_MODE', message: 'Mode de règlement indisponible' }] });
      if ((mode === 'online' || mode === 'deposit') && (q.onRequest || !(q.total > 0))) throw new HttpError(422, { errors: [{ code: 'PAYMENT_MODE', message: 'Paiement en ligne impossible pour un prix sur devis' }] });

      // Contrôle anti-falsification : le prix affiché doit être celui que le serveur calcule
      const serverTotal = q.onRequest ? null : q.total;
      const client = body.clientTotal === undefined ? undefined : body.clientTotal;
      if (!samePrice(client === undefined ? null : client, serverTotal) && !samePrice(body.acceptTotal === undefined ? undefined : body.acceptTotal, serverTotal)) {
        throw new HttpError(409, { code: 'PRICE_CHANGED', quote: publicQuote(q) });
      }

      const createdAt = clock();
      const booking = {
        id: randomToken(9), token: randomToken(18), ref: bookingRef(createdAt), tenant: tenant.id,
        status: mode === 'online' || mode === 'deposit' ? 'awaiting_payment' : 'pending_validation',
        createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString(),
        locale: clean(body.locale, 5) || (raw.settings && raw.settings.language) || 'fr',
        request: req, route: route ? { distanceKm: route.distanceKm, durationMin: route.durationMin, provider: route.provider, estimated: route.estimated } : null,
        quote: { ...q, legs: q.legs.map((l) => ({ ...l, from: undefined, to: undefined })) },
        customer,
        payment: {
          mode, provider: mode === 'online' || mode === 'deposit' ? provider : null, currency: cfg.currency,
          amountDue: mode === 'online' ? q.total : mode === 'deposit' ? q.deposit : 0, amountPaid: 0, url: null, externalId: null, paidAt: null
        },
        history: [{ at: createdAt.toISOString(), status: 'created', note: mode }],
        reminderSentAt: null
      };

      if (booking.status === 'awaiting_payment') {
        const service = cfg.services.find((s) => s.id === q.serviceId);
        const company = (raw.settings.company && raw.settings.company.name) || 'Taxi';
        const title = `${company} · ${service ? service.name : 'Course'} · ${booking.ref}${mode === 'deposit' ? ` (acompte ${cfg.deposit.percent} %)` : ''}`;
        const returnUrl = safeReturnUrl(tenant, body.returnUrl);
        const back = (extra) => `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}tp_booking=${booking.id}&tp_token=${booking.token}${extra || ''}`;
        try {
          const created = provider === 'stripe'
            ? await createStripePayment({ tenant, booking, amount: booking.payment.amountDue, title, currency: cfg.currency, successUrl: back(), cancelUrl: back('&tp_cancelled=1'), locale: booking.locale }, fetchImpl)
            : await createShopifyPayment({ tenant, booking, amount: booking.payment.amountDue, title, currency: cfg.currency }, fetchImpl);
          booking.payment.url = created.url;
          booking.payment.externalId = created.externalId;
        } catch (e) {
          log('error', 'création du paiement impossible', { tenant: tenant.id, error: e.message });
          throw new HttpError(502, { error: 'Le paiement en ligne est momentanément indisponible. Choisissez un autre mode ou appelez-nous.' });
        }
      }

      await store.save(tenant.id, booking);
      log('info', 'réservation créée', { tenant: tenant.id, ref: booking.ref, status: booking.status, total: q.total });
      await notify(tenant, raw, booking, booking.status === 'awaiting_payment' ? 'payment' : 'request',
        booking.status === 'awaiting_payment' ? { buttonUrl: booking.payment.url, amount: booking.payment.amountDue } : {});
      return {
        booking: { id: booking.id, ref: booking.ref, status: booking.status, token: booking.token },
        paymentUrl: booking.payment.url, quote: publicQuote(q)
      };
    },

    getPublic(tenant, id, token) {
      const b = store.get(tenant.id, id);
      if (!b || !token || b.token !== token) throw new HttpError(404, { error: 'Réservation introuvable' });
      return {
        booking: {
          id: b.id, ref: b.ref, status: b.status, firstName: b.customer.firstName, datetime: b.quote.datetime,
          total: b.quote.total, currency: b.payment.currency, paymentUrl: b.status === 'awaiting_payment' ? b.payment.url : null
        }
      };
    },

    async ics(tenant, id, token) {
      const b = store.get(tenant.id, id);
      if (!b || !token || b.token !== token) throw new HttpError(404, { error: 'Réservation introuvable' });
      const { raw, cfg } = await loadConfig(tenant);
      return calendar([bookingEvent(b, { company: raw.settings.company || {}, timeZone: cfg.timezone })], (raw.settings.company || {}).name);
    },

    async markPaid(tenant, bookingId, { amount, currency, externalId, source }) {
      const current = store.get(tenant.id, bookingId);
      if (!current) { log('warn', 'paiement pour une réservation inconnue', { tenant: tenant.id, bookingId }); return null; }
      if (current.status === 'confirmed' || current.status === 'completed') return current; // webhook rejoué
      if (currency && current.payment.currency && currency.toUpperCase() !== current.payment.currency) {
        log('error', 'devise du paiement inattendue', { tenant: tenant.id, ref: current.ref, currency }); return null;
      }
      if (!(Number(amount) + 0.009 >= current.payment.amountDue)) {
        log('error', 'montant payé insuffisant', { tenant: tenant.id, ref: current.ref, amount, due: current.payment.amountDue });
        await store.update(tenant.id, bookingId, (b) => { b.payment.mismatch = { amount, at: clock().toISOString() }; return b; });
        return null;
      }
      const updated = await store.update(tenant.id, bookingId, (b) => {
        b.payment.amountPaid = Number(amount); b.payment.paidAt = clock().toISOString(); b.payment.paidExternalId = externalId || null;
        return addHistory(b, 'confirmed', `paiement ${source}`);
      });
      const { raw } = await loadConfig(tenant);
      await notify(tenant, raw, updated, 'paid');
      return updated;
    },

    async shopifyWebhook(tenant, rawBody, headers) {
      if (!verifyShopifyWebhook(rawBody, headers['x-shopify-hmac-sha256'], tenant.payments.shopifyWebhookSecret)) throw new HttpError(401, { error: 'Signature invalide' });
      const topic = headers['x-shopify-topic'];
      if (topic !== 'orders/paid' && topic !== 'orders/create') return { ignored: topic };
      const o = parseShopifyOrder(JSON.parse(rawBody));
      if (!o.bookingId || !o.paid) return { ignored: 'not a paid Taxi Pro order' };
      const b = await this.markPaid(tenant, o.bookingId, { amount: o.amount, currency: o.currency, externalId: o.orderId, source: `Shopify ${o.orderName}` });
      return { ok: !!b };
    },

    async stripeWebhook(tenant, rawBody, headers) {
      if (!verifyStripeWebhook(rawBody, headers['stripe-signature'], tenant.payments.stripeWebhookSecret)) throw new HttpError(401, { error: 'Signature invalide' });
      const ev = parseStripeEvent(JSON.parse(rawBody));
      if (ev.type !== 'checkout.session.completed' && ev.type !== 'checkout.session.async_payment_succeeded') return { ignored: ev.type };
      if (!ev.paid || !ev.bookingId) return { ignored: 'unpaid' };
      const current = store.get(tenant.id, ev.bookingId);
      const amount = current ? ev.amountMinor / (toMinor(1, current.payment.currency) || 100) : 0;
      const b = await this.markPaid(tenant, ev.bookingId, { amount, currency: ev.currency, externalId: ev.externalId, source: 'Stripe' });
      return { ok: !!b };
    },

    /* ---------- Administration ---------- */
    adminList(tenant) {
      return store.list(tenant.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(adminView);
    },

    async adminAction(tenant, id, action, data = {}) {
      const b = store.get(tenant.id, id);
      if (!b) throw new HttpError(404, { error: 'Réservation introuvable' });
      const { raw, cfg } = await loadConfig(tenant);
      let updated;
      if (action === 'confirm') {
        if (b.status !== 'pending_validation') throw new HttpError(409, { error: 'Seule une réservation en attente de confirmation peut être confirmée (les paiements en ligne sont confirmés à réception du paiement).' });
        updated = await store.update(tenant.id, id, (x) => addHistory(x, 'confirmed', clean(data.note, 300) || 'confirmée par l’entreprise'));
        await notify(tenant, raw, updated, 'confirmed');
      } else if (action === 'cancel') {
        if (b.status === 'cancelled') throw new HttpError(409, { error: 'Déjà annulée' });
        updated = await store.update(tenant.id, id, (x) => addHistory(x, 'cancelled', clean(data.note, 300)));
        await notify(tenant, raw, updated, 'cancelled');
      } else if (action === 'complete') {
        if (b.status !== 'confirmed') throw new HttpError(409, { error: 'Seule une réservation confirmée peut être terminée' });
        updated = await store.update(tenant.id, id, (x) => addHistory(x, 'completed', clean(data.note, 300)));
      } else if (action === 'update') {
        const datetime = clean(data.datetime, 16), note = clean(data.adminNote, 1000);
        updated = await store.update(tenant.id, id, (x) => {
          if (datetime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetime)) {
            x.request.datetime = datetime; x.request.immediate = false;
            const rq = { ...x.request, route: x.route ? { distanceKm: x.route.distanceKm, durationMin: x.route.durationMin, estimated: x.route.estimated } : {} };
            const q = priceQuote(cfg, rq, { now: clock() });
            x.quote = { ...q, legs: q.legs.map((l) => ({ ...l, from: undefined, to: undefined })), onRequest: x.quote.onRequest || q.onRequest, total: x.quote.onRequest ? null : q.total };
            x.reminderSentAt = null;
          }
          if (note !== undefined) x.adminNote = note;
          x.history.push({ at: clock().toISOString(), status: x.status, note: 'modifiée' });
          x.updatedAt = clock().toISOString();
          return x;
        });
        if (datetime && data.notify !== false) await notify(tenant, raw, updated, 'modified');
      } else {
        throw new HttpError(400, { error: 'Action inconnue' });
      }
      return adminView(updated);
    },

    async adminCalendar(tenant) {
      const { raw, cfg } = await loadConfig(tenant);
      const events = store.list(tenant.id).filter((b) => b.status !== 'cancelled').map((b) => bookingEvent(b, { company: raw.settings.company || {}, timeZone: cfg.timezone }));
      return calendar(events, `${(raw.settings.company || {}).name || 'Taxi'} · réservations`);
    },

    /** Rappels avant le trajet : à lancer périodiquement. */
    async runReminders() {
      let sent = 0;
      for (const tenant of config.tenants) {
        let loaded = null;
        for (const b of store.list(tenant.id)) {
          if (b.status !== 'confirmed' || b.reminderSentAt) continue;
          if (!loaded) { try { loaded = await loadConfig(tenant); } catch (e) { log('error', 'rappels : configuration indisponible', { tenant: tenant.id }); break; } }
          const start = localToUtc(b.quote.datetime, loaded.cfg.timezone);
          if (!start) continue;
          const diff = start.getTime() - clock().getTime();
          if (diff <= 0 || diff > tenant.reminderHours * 3600000) continue;
          const updated = await store.update(tenant.id, b.id, (x) => { x.reminderSentAt = clock().toISOString(); return x; });
          const date = new Intl.DateTimeFormat(loaded.cfg.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(`${b.quote.datetime}:00Z`));
          await notify(tenant, loaded.raw, updated, 'reminder', { date });
          sent++;
        }
      }
      return sent;
    }
  };

  function safeReturnUrl(tenant, url) {
    try {
      const u = new URL(String(url || ''));
      if (tenant.allowedOrigins.includes(u.origin)) {
        // Seul le paramètre « view » est conservé (page de réservation intégrée /?view=reservation)
        const view = u.searchParams.get('view');
        return `${u.origin}${u.pathname}${view && /^[a-z0-9-]{1,40}$/.test(view) ? `?view=${view}` : ''}`;
      }
    } catch (e) { /* URL invalide */ }
    const cfgPage = tenant.storefrontUrl ? `${tenant.storefrontUrl}/pages/reservation` : '';
    return cfgPage || 'about:blank';
  }
}

export { sanitizeRequest, sanitizeCustomer, nowLocal, toLocalString, formatMoney };
