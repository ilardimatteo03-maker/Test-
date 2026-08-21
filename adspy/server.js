'use strict';

/* =========================================================
   ADSPY — serveur local

   Node 18+, zéro dépendance à installer.
   Lancement :  node adspy/server.js
   Puis :       http://localhost:4177

   Le serveur n'écoute que sur 127.0.0.1 : rien n'est exposé
   sur le réseau, aucune donnée ne part ailleurs que chez Meta
   au moment d'une collecte.
   ========================================================= */

const http = require('http');
const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

const store = require('./lib/store');
const meta = require('./lib/metaAdLibrary');
const { extractAdsFromPayload, parseMetaJson, winnerScore } = require('./lib/normalize');
const { adsCsv, leadsCsv } = require('./lib/csv');
const { adsFromHar } = require('./lib/har');

const PORT = Number(process.env.ADSPY_PORT) || 4177;
const HOST = '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY = 60 * 1024 * 1024;   // un HAR d'Ad Library peut être gros

/* ---------------------------------------------------------
   Helpers HTTP
   --------------------------------------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { 'content-type': contentType, ...extraHeaders });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('Corps de requête trop volumineux.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const raw = await readBody(req);
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('JSON invalide.');
  }
}

/** En-têtes autorisant la page Ad Library à pousser ses données ici. */
function captureCors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-allow-private-network', 'true');   // Chrome : accès réseau privé
  res.setHeader('access-control-max-age', '86400');
}

/* ---------------------------------------------------------
   Statique
   --------------------------------------------------------- */
async function serveStatic(req, res, urlPath) {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, relative);

  // Pas de sortie du dossier public.
  if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, 403, 'Interdit');

  try {
    const data = await fs.readFile(filePath);
    sendText(res, 200, data, MIME[path.extname(filePath)] || 'application/octet-stream', {
      'cache-control': 'no-cache',
    });
  } catch {
    sendText(res, 404, 'Page introuvable');
  }
}

/* ---------------------------------------------------------
   Filtres / tri de la bibliothèque locale
   --------------------------------------------------------- */
function filterAds(ads, query) {
  const {
    brand = '',
    status = 'all',
    format = 'all',
    platform = 'all',
    q = '',
    minDays = '',
    starred = '',
  } = query;

  const needle = q.trim().toLowerCase();

  let result = ads.filter(ad => {
    if (brand && ad.pageId !== brand) return false;
    if (status === 'active' && !ad.active) return false;
    if (status === 'inactive' && ad.active) return false;
    if (format !== 'all' && ad.format !== format) return false;
    if (platform !== 'all' && !(ad.platforms || []).includes(platform.toUpperCase())) return false;
    if (starred === '1' && !ad.starred) return false;
    if (minDays && (ad.daysActive || 0) < Number(minDays)) return false;
    if (needle) {
      const haystack = [ad.body, ad.title, ad.caption, ad.pageName, ad.ctaText, ad.linkDomain]
        .join(' ').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const sorters = {
    score: (a, b) => b.score - a.score,
    longevity: (a, b) => (b.daysActive || 0) - (a.daysActive || 0),
    recent: (a, b) => (b.startDate || 0) - (a.startDate || 0),
    variations: (a, b) => (b.variations || 0) - (a.variations || 0),
    reach: (a, b) => (b.reach || 0) - (a.reach || 0),
    brand: (a, b) => String(a.pageName).localeCompare(String(b.pageName)),
  };
  result.sort(sorters[query.sort] || sorters.score);
  return result;
}

/* ---------------------------------------------------------
   Comparateur de marques
   --------------------------------------------------------- */
const WEEK = 7 * 86_400_000;

function compareBrands(ads, pageIds) {
  const now = Date.now();

  return pageIds.map(pageId => {
    const brandAds = ads.filter(ad => ad.pageId === pageId);
    const active = brandAds.filter(ad => ad.active);
    const days = active.map(ad => ad.daysActive || 0);

    const countBy = (list, keyFn) => {
      const counts = {};
      for (const item of list) {
        for (const key of [].concat(keyFn(item) || [])) {
          if (!key) continue;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    // Rythme de lancement : nouvelles pubs par semaine sur 12 semaines.
    const cadence = Array.from({ length: 12 }, (_, i) => {
      const end = now - i * WEEK;
      const start = end - WEEK;
      return brandAds.filter(ad => ad.startDate && ad.startDate > start && ad.startDate <= end).length;
    }).reverse();

    return {
      pageId,
      pageName: brandAds[0]?.pageName || pageId,
      profilePic: brandAds[0]?.profilePic || '',
      totalAds: brandAds.length,
      activeAds: active.length,
      medianDays: store.median(days),
      maxDays: days.length ? Math.max(...days) : 0,
      avgVariations: active.length
        ? Math.round((active.reduce((sum, ad) => sum + (ad.variations || 1), 0) / active.length) * 10) / 10
        : 0,
      formatMix: {
        video: active.filter(ad => ad.format === 'video').length,
        image: active.filter(ad => ad.format === 'image').length,
        carrousel: active.filter(ad => ad.format === 'carrousel').length,
      },
      platforms: countBy(active, ad => ad.platforms),
      topCtas: countBy(active, ad => ad.ctaText).slice(0, 4),
      topDomains: countBy(active, ad => ad.linkDomain).slice(0, 4),
      cadence,
      newLast30d: brandAds.filter(ad => ad.startDate && now - ad.startDate < 30 * 86_400_000).length,
      topAds: [...brandAds].sort((a, b) => b.score - a.score).slice(0, 3),
      avgScore: active.length
        ? Math.round(active.reduce((sum, ad) => sum + ad.score, 0) / active.length)
        : 0,
    };
  });
}

/* ---------------------------------------------------------
   Proxy média — affiche et télécharge les créas.
   Les URLs Meta sont signées et expirent, et le navigateur
   bloque leur lecture directe : on passe par ici.
   Seuls les domaines Meta sont autorisés (pas de SSRF).
   --------------------------------------------------------- */
const ALLOWED_MEDIA_HOST = /(^|\.)(fbcdn\.net|facebook\.com|cdninstagram\.com)$/i;

function assertMetaUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL invalide.');
  }
  if (parsed.protocol !== 'https:') throw new Error('Seul https est autorisé.');
  if (!ALLOWED_MEDIA_HOST.test(parsed.hostname)) throw new Error('Domaine non autorisé.');
  return parsed;
}

async function proxyMedia(req, res, url) {
  let target;
  try {
    target = assertMetaUrl(url);
  } catch (err) {
    return sendText(res, 400, err.message);
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        referer: 'https://www.facebook.com/',
        ...(req.headers.range ? { range: req.headers.range } : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return sendText(res, upstream.status, 'Média indisponible (le lien Meta a probablement expiré).');
    }

    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      ...(upstream.headers.get('content-length') ? { 'content-length': upstream.headers.get('content-length') } : {}),
      ...(upstream.headers.get('content-range') ? { 'content-range': upstream.headers.get('content-range') } : {}),
      'accept-ranges': 'bytes',
      'cache-control': 'public, max-age=3600',
    });
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (err) {
    if (!res.headersSent) sendText(res, 502, `Média inaccessible : ${err.message}`);
  }
}

/** Enregistre une créa sur le disque, dans data/creatives/. */
async function saveCreative({ archiveId, index = 0 }) {
  const ads = await store.allAds();
  const ad = ads.find(item => item.archiveId === String(archiveId));
  if (!ad) throw new Error('Annonce inconnue.');

  const creative = (ad.creatives || [])[index];
  if (!creative) throw new Error('Créa introuvable pour cette annonce.');

  const url = creative.video || creative.image;
  if (!url) throw new Error('Pas de fichier à télécharger.');

  const target = assertMetaUrl(url);
  const upstream = await fetch(target, { headers: { referer: 'https://www.facebook.com/' } });
  if (!upstream.ok) throw new Error(`Meta a répondu ${upstream.status} (lien expiré ?).`);

  const extension = creative.video ? '.mp4' : (target.pathname.match(/\.(jpg|jpeg|png|webp)/i)?.[0] || '.jpg');
  const safeBrand = String(ad.pageName).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
  const fileName = `${safeBrand}_${ad.archiveId}_${index}${extension}`;
  const filePath = path.join(store.CREATIVES_DIR, fileName);

  fssync.mkdirSync(store.CREATIVES_DIR, { recursive: true });
  await pipeline(Readable.fromWeb(upstream.body), fssync.createWriteStream(filePath));

  return { fileName, filePath };
}

/* ---------------------------------------------------------
   Routes
   --------------------------------------------------------- */
async function handleApi(req, res, url) {
  const route = url.pathname;
  const query = Object.fromEntries(url.searchParams);

  /* --- état général --- */
  if (route === '/api/state' && req.method === 'GET') {
    const [brands, ads, settings, db] = await Promise.all([
      store.allBrands(), store.allAds(), store.getSettings(), store.getDb(),
    ]);
    return sendJson(res, 200, {
      brands,
      settings,
      counts: {
        ads: ads.length,
        active: ads.filter(ad => ad.active).length,
        brands: brands.length,
        starred: ads.filter(ad => ad.starred).length,
      },
      lastRuns: db.runs.slice(-8).reverse(),
    });
  }

  /* --- collecte live --- */
  if (route === '/api/search' && req.method === 'POST') {
    const params = await readJsonBody(req);
    const settings = await store.getSettings();
    const searchParams = {
      query: (params.query || '').trim(),
      pageId: (params.pageId || '').trim(),
      country: params.country || settings.country || 'BE',
      activeStatus: params.activeStatus || 'active',
      mediaType: params.mediaType || 'all',
      limit: Number(params.limit) || 30,
      cursor: params.cursor || null,
      docId: settings.docId || null,
    };

    if (!searchParams.query && !searchParams.pageId) {
      return sendJson(res, 400, { error: 'Indique une marque à chercher (ex : Gymshark) ou un identifiant de page.' });
    }

    try {
      const result = await meta.search(searchParams);
      const stats = await store.upsertAds(result.ads, {
        source: result.source,
        query: searchParams.query || searchParams.pageId,
        country: searchParams.country,
      });
      return sendJson(res, 200, {
        ok: true,
        source: result.source,
        cursor: result.cursor,
        hasMore: Boolean(result.hasMore || result.cursor),
        found: result.ads.length,
        ...stats,
      });
    } catch (err) {
      return sendJson(res, 502, {
        error: err.message,
        code: err.code || 'ERREUR',
        hint: err.hint || '',
      });
    }
  }

  /* --- capture depuis le navigateur (userscript / bookmarklet) --- */
  if (route === '/api/capture') {
    captureCors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Méthode non autorisée.' });

    const raw = await readBody(req);
    const payloads = parseMetaJson(raw);
    const ads = payloads.flatMap(extractAdsFromPayload);

    if (!ads.length) return sendJson(res, 200, { ok: true, added: 0, updated: 0, found: 0 });

    const stats = await store.upsertAds(ads, { source: 'navigateur', query: 'capture' });
    console.log(`[capture] ${ads.length} annonce(s) reçue(s) du navigateur — ${stats.added} nouvelle(s)`);
    return sendJson(res, 200, { ok: true, found: ads.length, ...stats });
  }

  /* --- import HAR --- */
  if (route === '/api/import/har' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const ads = adsFromHar(raw);
      if (!ads.length) {
        return sendJson(res, 200, { ok: true, found: 0, added: 0, updated: 0, note: 'Aucune annonce dans ce HAR. Vérifie qu\'il a été enregistré pendant que la page Ad Library chargeait des résultats.' });
      }
      const stats = await store.upsertAds(ads, { source: 'har', query: 'import' });
      return sendJson(res, 200, { ok: true, found: ads.length, ...stats });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  /* --- import JSON collé à la main --- */
  if (route === '/api/import/json' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const ads = parseMetaJson(raw).flatMap(extractAdsFromPayload);
      if (!ads.length) return sendJson(res, 400, { error: 'Aucune annonce reconnue dans ce JSON.' });
      const stats = await store.upsertAds(ads, { source: 'json', query: 'import' });
      return sendJson(res, 200, { ok: true, found: ads.length, ...stats });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  /* --- lecture de la bibliothèque --- */
  if (route === '/api/ads' && req.method === 'GET') {
    const ads = await store.allAds();
    const filtered = filterAds(ads, query);
    const limit = Math.min(Number(query.limit) || 60, 300);
    const offset = Number(query.offset) || 0;
    return sendJson(res, 200, {
      total: filtered.length,
      offset,
      ads: filtered.slice(offset, offset + limit),
    });
  }

  if (route === '/api/compare' && req.method === 'GET') {
    const pageIds = (query.brands || '').split(',').map(id => id.trim()).filter(Boolean);
    if (!pageIds.length) return sendJson(res, 400, { error: 'Choisis au moins une marque.' });
    const ads = await store.allAds();
    return sendJson(res, 200, { brands: compareBrands(ads, pageIds) });
  }

  /* --- édition --- */
  if (route === '/api/ad' && req.method === 'PATCH') {
    const { archiveId, ...patch } = await readJsonBody(req);
    const allowed = {};
    if ('starred' in patch) allowed.starred = Boolean(patch.starred);
    if ('notes' in patch) allowed.notes = String(patch.notes).slice(0, 2000);
    const ad = await store.updateAd(String(archiveId), allowed);
    return ad ? sendJson(res, 200, { ok: true, ad }) : sendJson(res, 404, { error: 'Annonce inconnue.' });
  }

  if (route === '/api/brand' && req.method === 'PATCH') {
    const { pageId, ...patch } = await readJsonBody(req);
    const allowed = {};
    if ('notes' in patch) allowed.notes = String(patch.notes).slice(0, 2000);
    if ('tags' in patch) allowed.tags = [].concat(patch.tags).map(String).slice(0, 12);
    const brand = await store.updateBrand(String(pageId), allowed);
    return brand ? sendJson(res, 200, { ok: true, brand }) : sendJson(res, 404, { error: 'Marque inconnue.' });
  }

  if (route === '/api/brand' && req.method === 'DELETE') {
    const { pageId } = await readJsonBody(req);
    await store.deleteBrand(String(pageId));
    return sendJson(res, 200, { ok: true });
  }

  if (route === '/api/settings' && req.method === 'POST') {
    const patch = await readJsonBody(req);
    const allowed = {};
    if ('country' in patch) allowed.country = String(patch.country).toUpperCase().slice(0, 2);
    if ('docId' in patch) allowed.docId = patch.docId ? String(patch.docId).replace(/\D/g, '') : null;
    const settings = await store.setSettings(allowed);
    meta.resetSession();
    return sendJson(res, 200, { ok: true, settings });
  }

  /* --- exports --- */
  if (route === '/api/export/ads.csv' && req.method === 'GET') {
    const ads = filterAds(await store.allAds(), query);
    return sendText(res, 200, adsCsv(ads), 'text/csv; charset=utf-8', {
      'content-disposition': `attachment; filename="pubs-meta-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
  }

  if (route === '/api/export/leads.csv' && req.method === 'GET') {
    const brands = await store.allBrands();
    return sendText(res, 200, leadsCsv(brands), 'text/csv; charset=utf-8', {
      'content-disposition': `attachment; filename="prospects-annonceurs-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
  }

  /* --- médias --- */
  if (route === '/api/media' && req.method === 'GET') {
    if (!query.url) return sendText(res, 400, 'Paramètre url manquant.');
    return proxyMedia(req, res, query.url);
  }

  if (route === '/api/creative/save' && req.method === 'POST') {
    try {
      const { archiveId, index } = await readJsonBody(req);
      const saved = await saveCreative({ archiveId, index: Number(index) || 0 });
      return sendJson(res, 200, { ok: true, ...saved });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  /* --- le script de capture, servi prêt à copier --- */
  if (route === '/api/bookmarklet' && req.method === 'GET') {
    const raw = await fs.readFile(path.join(PUBLIC_DIR, 'capture.user.js'), 'utf8');

    // Le script source cible le port par défaut ; on y injecte le port réel,
    // sinon un lancement sur ADSPY_PORT donnerait un marque-page qui parle
    // dans le vide.
    const source = raw.replaceAll('http://localhost:4177', `http://localhost:${PORT}`);

    const minified = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
    // encodeURIComponent et pas encodeURI : le script contient des codes
    // couleur (#8B5CF6), et un « # » non échappé couperait l'URL du favori.
    return sendJson(res, 200, {
      bookmarklet: `javascript:(function(){${encodeURIComponent(minified)}})()`,
      source,
      port: PORT,
    });
  }

  return sendJson(res, 404, { error: 'Route inconnue.' });
}

/* ---------------------------------------------------------
   Serveur
   --------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return await serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error('[serveur]', err);
    if (!res.headersSent) sendJson(res, 500, { error: err.message || 'Erreur interne.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ╭──────────────────────────────────────────────╮');
  console.log('  │  ADSPY — spy de publicités Meta              │');
  console.log(`  │  → http://localhost:${PORT}${' '.repeat(24 - String(PORT).length)}│`);
  console.log('  │  Ctrl+C pour arrêter                         │');
  console.log('  ╰──────────────────────────────────────────────╯');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Le port ${PORT} est déjà utilisé.`);
    console.error(`  Lance avec un autre port :  ADSPY_PORT=4188 node adspy/server.js\n`);
    process.exit(1);
  }
  throw err;
});
