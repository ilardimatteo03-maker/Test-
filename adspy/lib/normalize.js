'use strict';

/* =========================================================
   NORMALIZE — passe d'un objet brut Ad Library au modèle
   unifié utilisé partout dans l'app.

   Meta sert la même annonce sous deux formes selon le canal :
   - endpoint historique /ads/library/async/search_ads/  → clés camelCase (adArchiveID, pageID…)
   - endpoint GraphQL /api/graphql/                      → clés snake_case (ad_archive_id, page_id…)
   Les deux sont acceptées ici, et les clés inconnues sont
   ignorées sans faire tomber la collecte.
   ========================================================= */

const DAY = 86_400_000;

/** Lit la première clé présente parmi plusieurs orthographes. */
function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/** Meta renvoie des dates tantôt en secondes, tantôt en millisecondes. */
function toMillis(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num < 1e11 ? num * 1000 : num;
}

function domainOf(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** "1K-5K", "12 345", "> 1M" → nombre approximatif exploitable pour trier. */
function parseApproxNumber(value) {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return null;
  const matches = [...value.matchAll(/([\d.,]+)\s*([KMk m]?)/g)]
    .map(([, num, suffix]) => {
      const base = parseFloat(num.replace(/[ ,](?=\d{3}\b)/g, '').replace(',', '.'));
      if (!Number.isFinite(base)) return null;
      const mult = /k/i.test(suffix) ? 1e3 : /m/i.test(suffix) ? 1e6 : 1;
      return base * mult;
    })
    .filter(n => n !== null);
  if (!matches.length) return null;
  // Sur une fourchette ("1K-5K") on prend le milieu.
  return Math.round(matches.reduce((sum, n) => sum + n, 0) / matches.length);
}

/**
 * Extrait toutes les créas d'un snapshot : images, vidéos et
 * cartes de carrousel confondues, dans l'ordre d'affichage.
 */
function extractCreatives(snapshot) {
  const creatives = [];
  const push = (item) => {
    if (item && (item.image || item.video)) creatives.push(item);
  };

  for (const img of snapshot.images || []) {
    push({
      type: 'image',
      image: pick(img, 'original_image_url', 'resized_image_url', 'watermarked_resized_image_url'),
      thumb: pick(img, 'resized_image_url', 'original_image_url'),
    });
  }

  for (const video of snapshot.videos || []) {
    push({
      type: 'video',
      video: pick(video, 'video_hd_url', 'video_sd_url', 'watermarked_video_hd_url', 'watermarked_video_sd_url'),
      image: pick(video, 'video_preview_image_url'),
      thumb: pick(video, 'video_preview_image_url'),
    });
  }

  for (const card of snapshot.cards || []) {
    push({
      type: card.video_hd_url || card.video_sd_url ? 'video' : 'image',
      video: pick(card, 'video_hd_url', 'video_sd_url'),
      image: pick(card, 'original_image_url', 'resized_image_url', 'video_preview_image_url'),
      thumb: pick(card, 'resized_image_url', 'original_image_url', 'video_preview_image_url'),
      title: card.title || '',
      body: card.body || '',
      caption: card.caption || '',
      ctaText: card.cta_text || '',
      linkUrl: card.link_url || '',
    });
  }

  for (const img of snapshot.extra_images || []) {
    push({
      type: 'image',
      image: pick(img, 'original_image_url', 'resized_image_url'),
      thumb: pick(img, 'resized_image_url', 'original_image_url'),
    });
  }

  for (const video of snapshot.extra_videos || []) {
    push({
      type: 'video',
      video: pick(video, 'video_hd_url', 'video_sd_url'),
      image: pick(video, 'video_preview_image_url'),
      thumb: pick(video, 'video_preview_image_url'),
    });
  }

  return creatives;
}

/**
 * Score « winner » sur 100.
 *
 * Meta ne publie ni le budget ni le ROAS d'une pub commerciale :
 * aucun outil (TrendTrack inclus) ne peut les lire. Ce score est
 * donc une lecture de signaux publics, tous corrélés au fait
 * qu'un annonceur continue de payer pour une créa :
 *
 *   • Longévité (45 pts) — le signal le plus fort. Une créa qui
 *     tourne depuis 2 mois est rentable, personne ne brûle du
 *     budget deux mois sur une pub qui ne convertit pas.
 *   • Duplications (25 pts) — collation_count = nombre de copies
 *     de la même créa diffusées en parallèle. On duplique ce
 *     qu'on scale.
 *   • Toujours active (15 pts).
 *   • Portée déclarée (15 pts) — seulement fournie dans l'UE
 *     (transparence DSA), donc bonus et non pénalité.
 */
function winnerScore(ad) {
  const longevity = Math.min((ad.daysActive || 0) / 60, 1) * 45;
  const duplication = Math.min((ad.variations || 1) / 10, 1) * 25;
  const stillRunning = ad.active ? 15 : 0;
  const reach = ad.reach ? Math.min(ad.reach / 500_000, 1) * 15 : 0;
  return Math.round(longevity + duplication + stillRunning + reach);
}

/** Objet brut (peu importe la source) → annonce normalisée. */
function normalizeAd(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const snapshot = raw.snapshot || raw.adCreative || {};
  const archiveId = String(
    pick(raw, 'ad_archive_id', 'adArchiveID', 'adArchiveId', 'archiveID', 'id') || ''
  );
  if (!archiveId) return null;

  const startDate = toMillis(pick(raw, 'start_date', 'startDate', 'start_date_unix'));
  const endDate = toMillis(pick(raw, 'end_date', 'endDate'));
  const active = Boolean(pick(raw, 'is_active', 'isActive') ?? !endDate);

  // Durée de diffusion : jusqu'à aujourd'hui si la pub tourne encore.
  const until = active ? Date.now() : (endDate || Date.now());
  const daysActive = startDate ? Math.max(1, Math.round((until - startDate) / DAY)) : 0;

  const linkUrl = pick(snapshot, 'link_url', 'linkUrl') || '';
  const cards = snapshot.cards || [];
  const creatives = extractCreatives(snapshot);

  const displayFormat = String(
    pick(snapshot, 'display_format', 'displayFormat') ||
    (creatives.some(c => c.type === 'video') ? 'VIDEO' : 'IMAGE')
  ).toUpperCase();

  const reachRaw = pick(raw, 'reach_estimate', 'reachEstimate');
  const impressionsRaw =
    pick(raw.impressions_with_index || {}, 'impressions_text') ??
    pick(raw, 'impressions', 'impressionsText');

  const ad = {
    archiveId,
    adId: String(pick(raw, 'ad_id', 'adID', 'adId') || ''),
    pageId: String(pick(raw, 'page_id', 'pageID') || pick(snapshot, 'page_id', 'pageID') || ''),
    pageName: pick(raw, 'page_name', 'pageName') || pick(snapshot, 'page_name', 'current_page_name') || 'Inconnu',
    pageUrl: pick(snapshot, 'page_profile_uri', 'pageProfileUri') || '',
    profilePic: pick(snapshot, 'page_profile_picture_url', 'pageProfilePictureUrl') || '',
    pageLikes: pick(snapshot, 'page_like_count') || null,
    instagram: pick(snapshot, 'instagram_url', 'instagram_actor_name') || '',

    active,
    startDate,
    endDate,
    daysActive,
    variations: Number(pick(raw, 'collation_count', 'collationCount')) || 1,
    collationId: String(pick(raw, 'collation_id', 'collationID') || ''),

    platforms: (pick(raw, 'publisher_platform', 'publisherPlatform') || []).map(p => String(p).toUpperCase()),
    displayFormat,
    format: displayFormat.includes('VIDEO') ? 'video'
      : /CAROUSEL|MULTI|DCO|DPA/.test(displayFormat) ? 'carrousel'
        : 'image',

    // Le texte : c'est ce qu'on vient copier.
    body: pick(snapshot.body || {}, 'text', 'markup') || (typeof snapshot.body === 'string' ? snapshot.body : '') || '',
    title: pick(snapshot, 'title') || '',
    caption: pick(snapshot, 'caption') || '',
    linkDescription: pick(snapshot, 'link_description', 'linkDescription') || '',
    ctaText: pick(snapshot, 'cta_text', 'ctaText') || '',
    ctaType: pick(snapshot, 'cta_type', 'ctaType') || '',
    linkUrl,
    linkDomain: domainOf(linkUrl),

    creatives,
    cardCount: cards.length,

    reach: parseApproxNumber(reachRaw),
    impressions: impressionsRaw ? String(impressionsRaw) : null,
    spend: pick(raw, 'spend') || null,
    currency: pick(raw, 'currency') || '',
    countries: pick(raw, 'targeted_or_reached_countries', 'targetedOrReachedCountries') || [],

    libraryUrl: `https://www.facebook.com/ads/library/?id=${archiveId}`,
    capturedAt: Date.now(),
  };

  ad.score = winnerScore(ad);
  return ad;
}

/* ---------------------------------------------------------
   Extraction récursive : on récupère les annonces où qu'elles
   soient dans la réponse. Meta a déjà changé plusieurs fois
   la profondeur de son arbre GraphQL — chercher par forme
   plutôt que par chemin évite de casser au prochain refacto.
   --------------------------------------------------------- */
function extractAdsFromPayload(payload) {
  const found = [];
  const seen = new Set();

  const looksLikeAd = (node) =>
    node && typeof node === 'object' &&
    (node.ad_archive_id || node.adArchiveID || node.adArchiveId) &&
    (node.snapshot || node.publisher_platform || node.publisherPlatform);

  const walk = (node, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 14) return;

    if (looksLikeAd(node)) {
      const id = String(node.ad_archive_id || node.adArchiveID || node.adArchiveId);
      if (!seen.has(id)) {
        seen.add(id);
        found.push(node);
      }
      // Une annonce collationnée contient parfois ses variantes : on continue.
    }

    if (Array.isArray(node)) {
      for (const child of node) walk(child, depth + 1);
      return;
    }
    for (const child of Object.values(node)) walk(child, depth + 1);
  };

  walk(payload);
  return found.map(normalizeAd).filter(Boolean);
}

/**
 * Meta préfixe ses réponses JSON de `for (;;);` (anti-hijacking)
 * et renvoie parfois plusieurs objets JSON collés à la suite.
 */
function parseMetaJson(text) {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text.replace(/^\s*for\s*\(;;\);/, '').trim();
  const objects = [];

  try {
    objects.push(JSON.parse(cleaned));
    return objects;
  } catch { /* réponse multi-objets : on découpe à la main */ }

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') { if (depth++ === 0) start = i; }
    else if (char === '}') {
      if (--depth === 0 && start >= 0) {
        try { objects.push(JSON.parse(cleaned.slice(start, i + 1))); } catch { /* fragment inutilisable */ }
        start = -1;
      }
    }
  }
  return objects;
}

module.exports = {
  normalizeAd,
  extractAdsFromPayload,
  parseMetaJson,
  winnerScore,
  parseApproxNumber,
  domainOf,
};
