// Utilitaires communs du service de réservation TAXI PRO (aucune dépendance externe).
import crypto from 'node:crypto';

export const now = () => new Date();

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Référence lisible : TP-AAMMJJ-XXXX (sans caractères ambigus). */
export function bookingRef(date = new Date()) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(5);
  for (const b of bytes) code += alphabet[b % alphabet.length];
  const p = (n) => String(n).padStart(2, '0');
  return `TP-${String(date.getUTCFullYear()).slice(2)}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}-${code}`;
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

export function hmacBase64(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}
export function hmacHex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Nettoie un texte saisi par un visiteur : caractères de contrôle retirés, longueur bornée. */
export function clean(v, max = 200) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function escapeHtml(v) {
  return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function isEmail(v) {
  return /^[^\s@<>()[\],;:]+@[^\s@<>()[\],;:]+\.[^\s@<>()[\],;:]{2,}$/.test(String(v || '').trim());
}
export function isPhone(v) {
  return String(v || '').replace(/[^\d]/g, '').length >= 8 && String(v || '').length <= 30;
}

/** Résout les valeurs « env:NOM_VARIABLE » d'un objet de configuration. */
export function resolveEnv(value) {
  if (typeof value === 'string' && value.startsWith('env:')) return process.env[value.slice(4)] || '';
  if (Array.isArray(value)) return value.map(resolveEnv);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveEnv(v);
    return out;
  }
  return value;
}

export function log(level, message, data) {
  const line = { t: new Date().toISOString(), level, message };
  if (data) Object.assign(line, data);
  (level === 'error' ? console.error : console.log)(JSON.stringify(line));
}

/** Décode une polyligne encodée (format Google) en [[lat, lng]…]. */
export function decodePolyline(str) {
  const out = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    for (const axis of [0, 1]) {
      let result = 0, shift = 0, b;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta; else lng += delta;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

/** Limiteur de débit en mémoire (fenêtre glissante simple par clé). */
export function createRateLimiter() {
  const hits = new Map();
  return function allow(key, limit, windowMs) {
    const t = Date.now();
    const arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (arr.length >= limit) { hits.set(key, arr); return false; }
    arr.push(t);
    hits.set(key, arr);
    if (hits.size > 10000) for (const [k, v] of hits) if (!v.length || t - v[v.length - 1] > windowMs) hits.delete(k);
    return true;
  };
}
