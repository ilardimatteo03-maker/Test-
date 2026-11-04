// Configuration du service : un ou plusieurs clients (« tenants »), chacun relié à une boutique Shopify.
// Les secrets ne sont jamais écrits dans le fichier : on y met « env:NOM_VARIABLE ».
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveEnv } from './util.js';

function fromEnv() {
  const e = process.env;
  if (!e.SHOP_DOMAIN && !e.STOREFRONT_URL && !e.CONFIG_FILE) return [];
  return [{
    id: e.TENANT_ID || 'default',
    shopDomain: e.SHOP_DOMAIN || '',
    storefrontUrl: e.STOREFRONT_URL || '',
    storefrontPassword: e.STOREFRONT_PASSWORD || '',
    previewThemeId: e.PREVIEW_THEME_ID || '',
    configFile: e.CONFIG_FILE || '',
    allowedOrigins: (e.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    routing: { provider: e.ROUTING_PROVIDER || 'osrm', apiKey: e.ROUTING_API_KEY || '', osrmUrl: e.OSRM_URL || '', estimateFallback: e.ROUTING_ESTIMATE_FALLBACK === 'true', roadFactor: Number(e.ROAD_FACTOR || 1.3) },
    email: { provider: e.EMAIL_PROVIDER || 'console', apiKey: e.EMAIL_API_KEY || '', from: e.EMAIL_FROM || '', adminEmail: e.ADMIN_EMAIL || '', replyTo: e.EMAIL_REPLY_TO || '' },
    payments: {
      provider: e.PAYMENT_PROVIDER || '',
      shopifyAdminToken: e.SHOPIFY_ADMIN_TOKEN || '', shopifyApiVersion: e.SHOPIFY_API_VERSION || '2025-01',
      shopifyWebhookSecret: e.SHOPIFY_WEBHOOK_SECRET || '',
      stripeSecretKey: e.STRIPE_SECRET_KEY || '', stripeWebhookSecret: e.STRIPE_WEBHOOK_SECRET || ''
    },
    adminToken: e.ADMIN_TOKEN || '',
    webhookUrl: e.OUTBOUND_WEBHOOK_URL || '', webhookSecret: e.OUTBOUND_WEBHOOK_SECRET || '',
    reminderHours: Number(e.REMINDER_HOURS || 24)
  }];
}

export function loadConfig(env = process.env) {
  const file = env.TENANTS_FILE ? resolve(env.TENANTS_FILE) : '';
  let tenants = [];
  if (file) {
    if (!existsSync(file)) throw new Error(`TENANTS_FILE introuvable : ${file}`);
    tenants = JSON.parse(readFileSync(file, 'utf8'));
  } else {
    tenants = fromEnv();
  }
  tenants = tenants.map((t) => normalizeTenant(resolveEnv(t)));
  return {
    port: Number(env.PORT || 8787),
    host: env.HOST || '0.0.0.0',
    publicUrl: (env.PUBLIC_URL || '').replace(/\/+$/, ''),
    dataDir: resolve(env.DATA_DIR || 'data'),
    configCacheSeconds: Number(env.CONFIG_CACHE_SECONDS || 60),
    trustProxy: env.TRUST_PROXY === 'true',
    tenants
  };
}

export function normalizeTenant(t) {
  const id = String(t.id || t.shopDomain || 'default').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const origins = new Set((t.allowedOrigins || []).map((o) => o.replace(/\/+$/, '')));
  if (t.storefrontUrl) origins.add(new URL(t.storefrontUrl).origin);
  if (t.shopDomain) origins.add(`https://${t.shopDomain}`);
  return {
    ...t,
    id,
    shopDomain: String(t.shopDomain || '').toLowerCase(),
    storefrontUrl: String(t.storefrontUrl || '').replace(/\/+$/, ''),
    allowedOrigins: [...origins],
    routing: { provider: 'osrm', ...(t.routing || {}) },
    email: { provider: 'console', ...(t.email || {}) },
    payments: { shopifyApiVersion: '2025-01', ...(t.payments || {}) },
    reminderHours: Number(t.reminderHours || 24)
  };
}

export function findTenant(config, shop) {
  const key = String(shop || '').toLowerCase();
  if (config.tenants.length === 1 && !key) return config.tenants[0];
  return config.tenants.find((t) => t.shopDomain === key || t.id === key) || null;
}
