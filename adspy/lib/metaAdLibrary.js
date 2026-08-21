'use strict';

/* =========================================================
   META AD LIBRARY — client de collecte

   L'Ad Library (facebook.com/ads/library) est le registre
   public que Meta est obligé de publier : toute pub diffusée
   y est consultable sans compte. C'est cette source publique
   qu'on interroge ici, exactement comme le fait le site quand
   on l'ouvre dans un navigateur.

   Meta ne documente pas d'API pour la partie commerciale, donc
   la collecte automatique passe par les mêmes appels que la
   page web, avec deux chemins et un filet de sécurité :

     1. /ads/library/async/search_ads/  — endpoint historique,
        simple, encore servi dans certaines régions.
     2. /api/graphql/                   — ce que fait le site
        aujourd'hui. Nécessite un token `lsd` + un `doc_id`,
        tous deux récupérés à la volée sur la page (le doc_id
        change à chaque déploiement de Meta : on le relit et on
        le met en cache plutôt que de le figer dans le code).
     3. Si Meta bloque les deux (captcha, region lock, rate
        limit), le mode capture navigateur prend le relais :
        voir public/capture.user.js. Ce chemin-là ne peut pas
        casser, puisque c'est le navigateur de l'utilisateur
        qui charge la page normalement.

   Politesse : une seule requête à la fois, délai minimum entre
   deux appels, et on s'arrête net sur un 429.
   ========================================================= */

const { randomUUID } = require('crypto');
const { extractAdsFromPayload, parseMetaJson } = require('./normalize');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const MIN_DELAY_MS = 1200;   // jamais plus d'une requête par seconde et quelque
const TIMEOUT_MS = 30_000;

let lastRequestAt = 0;
let session = null;          // { lsd, cookies, spin, rev, fetchedAt }
let docIdCache = null;       // { docId, fetchedAt }

const SESSION_TTL = 20 * 60 * 1000;
const DOCID_TTL = 12 * 60 * 60 * 1000;

class AdLibraryError extends Error {
  constructor(message, { code = 'ERREUR', hint = '' } = {}) {
    super(message);
    this.code = code;
    this.hint = hint;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function throttle() {
  const wait = lastRequestAt + MIN_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

async function request(url, options = {}) {
  await throttle();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
        ...(options.headers || {}),
      },
    });
    if (res.status === 429) {
      throw new AdLibraryError('Meta limite le débit (429).', {
        code: 'RATE_LIMIT',
        hint: 'Attends quelques minutes, ou passe en mode capture navigateur.',
      });
    }
    return res;
  } catch (err) {
    if (err instanceof AdLibraryError) throw err;
    if (err.name === 'AbortError') {
      throw new AdLibraryError('Meta n\'a pas répondu à temps.', { code: 'TIMEOUT' });
    }
    throw new AdLibraryError(`Connexion à Meta impossible : ${err.message}`, {
      code: 'RESEAU',
      hint: 'Vérifie ta connexion et que facebook.com est accessible depuis cette machine.',
    });
  } finally {
    clearTimeout(timer);
  }
}

function buildSearchUrl({ query = '', pageId = '', country = 'BE', activeStatus = 'active', mediaType = 'all' }) {
  const params = new URLSearchParams({
    active_status: activeStatus,
    ad_type: 'all',
    country,
    media_type: mediaType,
    search_type: pageId ? 'page' : 'keyword_unordered',
  });
  if (pageId) params.set('view_all_page_id', pageId);
  else params.set('q', query);
  return `https://www.facebook.com/ads/library/?${params}`;
}

/* ---------------------------------------------------------
   Session : token lsd + cookies + numéros de build.
   --------------------------------------------------------- */
async function getSession(searchParams, { force = false } = {}) {
  if (!force && session && Date.now() - session.fetchedAt < SESSION_TTL) return session;

  const res = await request(buildSearchUrl(searchParams));
  const html = await res.text();

  const cookies = (res.headers.getSetCookie?.() || [])
    .map(cookie => cookie.split(';')[0])
    .join('; ');

  const grab = (regex) => html.match(regex)?.[1] || null;

  const lsd =
    grab(/"LSD",\[\],\{"token":"([^"]+)"/) ||
    grab(/name="lsd"\s+value="([^"]+)"/) ||
    grab(/\["LSD",\[\],\{"token":"([^"]+)"\}/);

  if (!lsd) {
    throw new AdLibraryError('Meta n\'a pas renvoyé de page exploitable (pas de token).', {
      code: 'PAS_DE_TOKEN',
      hint: 'Meta a probablement servi un mur de connexion ou un captcha. Utilise le mode capture navigateur.',
    });
  }

  session = {
    lsd,
    cookies,
    html,
    rev: grab(/"__spin_r":(\d+)/) || grab(/"client_revision":(\d+)/) || grab(/"rev":(\d+)/),
    spinB: grab(/"__spin_b":"([^"]+)"/) || 'trunk',
    spinT: grab(/"__spin_t":(\d+)/) || String(Math.floor(Date.now() / 1000)),
    hs: grab(/"haste_session":"([^"]+)"/),
    jazoest: grab(/name="jazoest"\s+value="(\d+)"/) || '2957',
    fetchedAt: Date.now(),
  };
  return session;
}

/* ---------------------------------------------------------
   doc_id : identifiant de la requête GraphQL persistée.
   Meta le régénère à chaque déploiement — on va donc le lire
   dans les bundles JS de la page plutôt que de le coder en dur.
   --------------------------------------------------------- */
const DOC_ID_PATTERNS = [
  /__d\("AdLibrarySearchPaginationQuery_facebookRelayOperation",\[\],\(function\([^)]*\)\{[^}]*?e\.exports="(\d+)"/,
  /"AdLibrarySearchPaginationQuery"[^{}]{0,200}?"id":"(\d+)"/,
  /AdLibrarySearchPaginationQuery[^0-9]{0,120}?(\d{15,20})/,
];

function matchDocId(text) {
  for (const pattern of DOC_ID_PATTERNS) {
    const found = text.match(pattern)?.[1];
    if (found) return found;
  }
  return null;
}

async function findDocId(searchParams, { force = false } = {}) {
  if (!force && docIdCache && Date.now() - docIdCache.fetchedAt < DOCID_TTL) return docIdCache.docId;

  const current = await getSession(searchParams, { force });

  // 1. Parfois présent directement dans le HTML.
  let docId = matchDocId(current.html);

  // 2. Sinon on parcourt les bundles JS référencés par la page.
  if (!docId) {
    const scripts = [...current.html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)]
      .map(match => match[1].replace(/&amp;/g, '&'))
      .filter(url => url.includes('fbcdn.net') || url.startsWith('https://static'))
      .slice(0, 30);

    for (const url of scripts) {
      try {
        const res = await request(url, { headers: { referer: 'https://www.facebook.com/' } });
        if (!res.ok) continue;
        docId = matchDocId(await res.text());
        if (docId) break;
      } catch {
        // bundle inaccessible : on passe au suivant
      }
    }
  }

  if (!docId) {
    throw new AdLibraryError('Impossible de retrouver l\'identifiant de requête de Meta (doc_id).', {
      code: 'PAS_DE_DOCID',
      hint: 'Meta a changé son bundle. Renseigne un doc_id à la main dans les réglages, ou utilise le mode capture navigateur.',
    });
  }

  docIdCache = { docId, fetchedAt: Date.now() };
  return docId;
}

/* ---------------------------------------------------------
   Chemin 1 — endpoint async historique.
   --------------------------------------------------------- */
async function searchViaAsync(params) {
  const { query = '', pageId = '', country = 'BE', activeStatus = 'active', mediaType = 'all', limit = 30, cursor = null } = params;
  const current = await getSession(params);

  const search = new URLSearchParams({
    count: String(Math.min(limit, 30)),
    active_status: activeStatus,
    ad_type: 'all',
    media_type: mediaType,
    search_type: pageId ? 'page' : 'keyword_unordered',
    'countries[0]': country,
    session_id: randomUUID(),
    __a: '1',
    lsd: current.lsd,
  });
  if (pageId) search.set('view_all_page_id', pageId);
  else search.set('q', query);
  if (cursor) search.set('forward_cursor', cursor);

  const res = await request(`https://www.facebook.com/ads/library/async/search_ads/?${search}`, {
    headers: {
      accept: '*/*',
      cookie: current.cookies,
      referer: buildSearchUrl(params),
      'x-fb-lsd': current.lsd,
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  const text = await res.text();
  const payloads = parseMetaJson(text);
  if (!payloads.length) throw new AdLibraryError('Réponse illisible de l\'endpoint async.', { code: 'PARSE' });

  const ads = payloads.flatMap(extractAdsFromPayload);
  const nextCursor = payloads
    .map(p => p?.payload?.forwardCursor ?? p?.payload?.forward_cursor ?? null)
    .find(Boolean) || null;

  if (!ads.length) throw new AdLibraryError('Aucune annonce dans la réponse async.', { code: 'VIDE' });
  return { ads, cursor: nextCursor, source: 'async' };
}

/* ---------------------------------------------------------
   Chemin 2 — GraphQL (ce que fait le site aujourd'hui).
   --------------------------------------------------------- */
async function searchViaGraphQL(params, { forceRefresh = false } = {}) {
  const { query = '', pageId = '', country = 'BE', activeStatus = 'active', mediaType = 'all', limit = 30, cursor = null, docId: forcedDocId = null } = params;

  const current = await getSession(params, { force: forceRefresh });
  const docId = forcedDocId || await findDocId(params, { force: forceRefresh });

  const variables = {
    activeStatus: activeStatus.toUpperCase(),
    adType: 'ALL',
    bylines: [],
    collationToken: null,
    contentLanguages: [],
    countries: [country],
    cursor,
    excludedIDs: [],
    first: Math.min(limit, 30),
    location: null,
    mediaType,
    pageIDs: [],
    potentialReachInput: [],
    publisherPlatforms: [],
    queryString: pageId ? '' : query,
    regions: [],
    searchType: pageId ? 'PAGE' : 'KEYWORD_UNORDERED',
    sessionID: randomUUID(),
    sortData: null,
    source: null,
    startDate: null,
    v: 'b9c1a1',
    viewAllPageID: pageId || '0',
  };

  const body = new URLSearchParams({
    av: '0',
    __aaid: '0',
    __user: '0',
    __a: '1',
    __req: '1',
    dpr: '1',
    __ccg: 'EXCELLENT',
    __rev: current.rev || '1010000000',
    __spin_r: current.rev || '1010000000',
    __spin_b: current.spinB,
    __spin_t: current.spinT,
    lsd: current.lsd,
    jazoest: current.jazoest,
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'AdLibrarySearchPaginationQuery',
    server_timestamps: 'true',
    doc_id: docId,
    variables: JSON.stringify(variables),
  });

  const res = await request('https://www.facebook.com/api/graphql/', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: '*/*',
      cookie: current.cookies,
      origin: 'https://www.facebook.com',
      referer: buildSearchUrl(params),
      'x-fb-lsd': current.lsd,
      'x-fb-friendly-name': 'AdLibrarySearchPaginationQuery',
    },
    body: body.toString(),
  });

  const text = await res.text();
  const payloads = parseMetaJson(text);

  const errorMessage = payloads
    .map(p => p?.errors?.[0]?.message || p?.error?.message)
    .find(Boolean);

  const ads = payloads.flatMap(extractAdsFromPayload);

  if (!ads.length) {
    // Un doc_id périmé provoque une erreur GraphQL : on le rejette et on retente une fois.
    if (!forceRefresh && errorMessage) {
      docIdCache = null;
      session = null;
      return searchViaGraphQL(params, { forceRefresh: true });
    }
    throw new AdLibraryError(
      errorMessage ? `Meta a refusé la requête : ${errorMessage}` : 'Aucune annonce trouvée pour cette recherche.',
      { code: errorMessage ? 'GRAPHQL' : 'VIDE' }
    );
  }

  const pageInfo = findPageInfo(payloads);
  return { ads, cursor: pageInfo?.end_cursor || null, hasMore: Boolean(pageInfo?.has_next_page), source: 'graphql' };
}

function findPageInfo(payloads) {
  let found = null;
  const walk = (node, depth = 0) => {
    if (found || !node || typeof node !== 'object' || depth > 12) return;
    if (node.end_cursor !== undefined || node.has_next_page !== undefined) { found = node; return; }
    for (const child of Object.values(node)) walk(child, depth + 1);
  };
  payloads.forEach(p => walk(p));
  return found;
}

/**
 * Recherche : tente les deux chemins, renvoie le premier qui donne
 * des annonces, et remonte une erreur lisible si aucun ne passe.
 */
async function search(params) {
  const attempts = [];

  for (const [name, runner] of [['graphql', searchViaGraphQL], ['async', searchViaAsync]]) {
    try {
      const result = await runner(params);
      if (result.ads.length) return result;
      attempts.push(`${name}: 0 annonce`);
    } catch (err) {
      attempts.push(`${name}: ${err.message}`);
      if (err.code === 'RATE_LIMIT') throw err;   // inutile d'insister
    }
  }

  throw new AdLibraryError(
    'La collecte automatique n\'a rien pu récupérer.',
    {
      code: 'ECHEC_TOTAL',
      hint: `Détail — ${attempts.join(' | ')}. Passe par le mode capture navigateur (bouton « Mode navigateur » dans l'app) : il fonctionne même quand Meta bloque les appels directs.`,
    }
  );
}

/** Réinitialise session + doc_id (bouton « réessayer » de l'app). */
function resetSession() {
  session = null;
  docIdCache = null;
}

module.exports = { search, searchViaGraphQL, searchViaAsync, resetSession, AdLibraryError, buildSearchUrl };
