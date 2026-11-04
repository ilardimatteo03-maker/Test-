// Paiement par Stripe Checkout : session créée côté serveur avec la clé secrète,
// confirmation uniquement par le webhook « checkout.session.completed » signé.
import { hmacHex, safeEqual } from '../util.js';

const ZERO_DECIMAL = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
export const toMinor = (amount, currency) => Math.round(amount * (ZERO_DECIMAL.includes(currency) ? 1 : 100));

export async function createStripePayment({ tenant, booking, amount, title, currency, successUrl, cancelUrl, locale }, fetchImpl = fetch) {
  const key = tenant.payments.stripeSecretKey;
  if (!key) throw new Error('Paiement Stripe non configuré');
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: booking.customer.email,
    client_reference_id: booking.id,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(toMinor(amount, currency)),
    'line_items[0][price_data][product_data][name]': title,
    'metadata[booking_id]': booking.id,
    'metadata[ref]': booking.ref,
    'payment_intent_data[metadata][booking_id]': booking.id,
    locale: ['fr', 'en', 'nl', 'de', 'it', 'es'].includes(locale) ? locale : 'auto'
  });
  const res = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `taxipro-${booking.id}-${toMinor(amount, currency)}` },
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe : ${(data.error && data.error.message) || res.status}`);
  return { url: data.url, externalId: data.id };
}

/** Vérifie l'en-tête Stripe-Signature (t=…, v1=…) avec une tolérance de 5 minutes. */
export function verifyStripeWebhook(rawBody, header, secret, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = hmacHex(secret, `${t}.${rawBody}`);
  return String(header).split(',').filter((p) => p.trim().startsWith('v1=')).some((p) => safeEqual(expected, p.trim().slice(3)));
}

export function parseStripeEvent(event) {
  const s = (event.data && event.data.object) || {};
  return {
    type: event.type,
    bookingId: (s.metadata && s.metadata.booking_id) || s.client_reference_id,
    paid: s.payment_status === 'paid',
    amountMinor: s.amount_total,
    currency: String(s.currency || '').toUpperCase(),
    externalId: s.id
  };
}
