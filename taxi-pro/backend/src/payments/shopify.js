// Paiement par Shopify : le serveur crée une commande provisoire (draft order) au prix recalculé,
// puis renvoie son lien de facture. Le client paie dans le checkout Shopify (Shopify Payments ou
// autre moyen activé). La réservation n'est confirmée qu'à la réception du webhook « orders/paid ».
// Jeton requis : application personnalisée avec les accès write_draft_orders et read_orders.
import { hmacBase64, safeEqual } from '../util.js';

const MUTATION = `mutation TaxiProDraftOrder($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder { id invoiceUrl }
    userErrors { field message }
  }
}`;

async function gql(tenant, query, variables, fetchImpl) {
  const p = tenant.payments;
  const res = await fetchImpl(`https://${tenant.shopDomain}/admin/api/${p.shopifyApiVersion || '2025-01'}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': p.shopifyAdminToken },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`);
  return res.json();
}

/**
 * @returns {Promise<{ url: string, externalId: string }>}
 */
export async function createShopifyPayment({ tenant, booking, amount, title, currency }, fetchImpl = fetch) {
  if (!tenant.payments.shopifyAdminToken || !tenant.shopDomain) throw new Error('Paiement Shopify non configuré');
  const line = (priceField) => ({
    title, quantity: 1, requiresShipping: false, taxable: false,
    ...(priceField === 'originalUnitPriceWithCurrency'
      ? { originalUnitPriceWithCurrency: { amount: amount.toFixed(2), currencyCode: currency } }
      : { originalUnitPrice: amount.toFixed(2) }),
    customAttributes: [{ key: 'Réservation', value: booking.ref }]
  });
  const input = (priceField) => ({
    email: booking.customer.email,
    note: `Réservation ${booking.ref} — TAXI PRO`,
    tags: ['taxi-pro', `ref-${booking.ref}`],
    customAttributes: [{ key: 'taxipro_booking_id', value: booking.id }, { key: 'taxipro_ref', value: booking.ref }],
    lineItems: [line(priceField)]
  });
  // Champ de prix récent d'abord ; repli sur l'ancien nom si la version d'API ne le connaît pas.
  let data = await gql(tenant, MUTATION, { input: input('originalUnitPriceWithCurrency') }, fetchImpl);
  if (data.errors && JSON.stringify(data.errors).includes('originalUnitPriceWithCurrency')) {
    data = await gql(tenant, MUTATION, { input: input('originalUnitPrice') }, fetchImpl);
  }
  if (data.errors) throw new Error(`Shopify : ${data.errors.map((e) => e.message).join(', ')}`);
  const r = data.data.draftOrderCreate;
  if (r.userErrors && r.userErrors.length) throw new Error(`Shopify : ${r.userErrors.map((e) => e.message).join(', ')}`);
  return { url: r.draftOrder.invoiceUrl, externalId: r.draftOrder.id };
}

/** Vérifie la signature X-Shopify-Hmac-Sha256 sur le corps brut de la requête. */
export function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!secret || !hmacHeader) return false;
  return safeEqual(hmacBase64(secret, rawBody), hmacHeader);
}

/** Extrait l'identifiant de réservation et le montant payé d'une commande Shopify (webhook orders/paid). */
export function parseShopifyOrder(order) {
  const attrs = order.note_attributes || order.noteAttributes || [];
  const get = (k) => (attrs.find((a) => (a.name || a.key) === k) || {}).value;
  return {
    bookingId: get('taxipro_booking_id'),
    amount: Number(order.total_price || (order.current_total_price_set && order.current_total_price_set.shop_money.amount) || 0),
    currency: order.currency,
    paid: order.financial_status === 'paid' || order.financial_status === 'partially_refunded',
    orderId: String(order.id || ''), orderName: order.name || ''
  };
}
