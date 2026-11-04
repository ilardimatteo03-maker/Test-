// Lecture de la configuration tarifaire publiée par le thème.
// Source de confiance : la boutique elle-même (page /?view=taxi-config rendue par Shopify à partir
// du thème publié, ou d'un thème en aperçu si previewThemeId est renseigné). Les prix envoyés par
// le navigateur ne sont jamais utilisés tels quels.
import { readFileSync } from 'node:fs';
import { log } from './util.js';

const cache = new Map();

export function parseConfigHtml(html) {
  const raw = { settings: null, vehicles: [], options: [], services: [], zones: [], routes: [], timeRules: [] };
  const re = /<script type="application\/json" data-tp-config="(\w+)">([\s\S]*?)<\/script>/g;
  let m, found = 0;
  while ((m = re.exec(html))) {
    const key = m[1];
    const value = JSON.parse(m[2]);
    if (Array.isArray(raw[key]) && Array.isArray(value)) raw[key] = raw[key].concat(value);
    else raw[key] = value;
    found++;
  }
  if (!found || !raw.settings) throw new Error('Configuration Taxi Pro introuvable dans la page de la boutique');
  raw.labels = raw.settings.labels || {};
  return raw;
}

async function unlockStorefront(base, password, fetchImpl) {
  const body = new URLSearchParams({ form_type: 'storefront_password', utf8: '✓', password });
  const res = await fetchImpl(`${base}/password`, {
    method: 'POST', body, redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TaxiPro-Backend/1.0' }
  });
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

/**
 * Configuration brute du thème pour un client, mise en cache quelques secondes.
 * tenant.configFile (JSON local) remplace la lecture de la boutique : utile pour les tests
 * ou pour un site non Shopify.
 */
export async function getRawConfig(tenant, { fetchImpl = fetch, cacheSeconds = 60, force = false } = {}) {
  const key = tenant.id;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < cacheSeconds * 1000) return hit.raw;
  let raw;
  if (tenant.configFile) {
    raw = JSON.parse(readFileSync(tenant.configFile, 'utf8'));
    if (!raw.labels && raw.settings) raw.labels = raw.settings.labels || {};
  } else {
    if (!tenant.storefrontUrl) throw new Error(`storefrontUrl manquant pour ${tenant.id}`);
    const url = new URL(tenant.storefrontUrl + '/');
    url.searchParams.set('view', 'taxi-config');
    if (tenant.previewThemeId) url.searchParams.set('preview_theme_id', tenant.previewThemeId);
    const headers = { 'User-Agent': 'TaxiPro-Backend/1.0', Accept: 'text/html' };
    let res = await fetchImpl(url, { headers, redirect: 'follow' });
    let html = await res.text();
    if ((/storefront_password|\/password/.test(res.url || '') || /name="form_type" value="storefront_password"/.test(html)) && tenant.storefrontPassword) {
      headers.Cookie = await unlockStorefront(tenant.storefrontUrl, tenant.storefrontPassword, fetchImpl);
      res = await fetchImpl(url, { headers, redirect: 'follow' });
      html = await res.text();
    }
    if (!res.ok) throw new Error(`Boutique injoignable (${res.status}) pour ${tenant.id}`);
    try {
      raw = parseConfigHtml(html);
    } catch (e) {
      // Repli : la page d'accueil contient aussi la configuration (layout theme.liquid)
      const home = await fetchImpl(tenant.storefrontUrl + '/' + (tenant.previewThemeId ? `?preview_theme_id=${tenant.previewThemeId}` : ''), { headers });
      raw = parseConfigHtml(await home.text());
    }
  }
  cache.set(key, { raw, at: Date.now() });
  log('info', 'configuration chargée', { tenant: tenant.id, vehicles: raw.vehicles.length, routes: raw.routes.length });
  return raw;
}

export function clearConfigCache() { cache.clear(); }
