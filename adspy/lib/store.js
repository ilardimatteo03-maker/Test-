'use strict';

/* =========================================================
   STORE — persistance locale (JSON sur disque)

   Aucune base de données à installer : tout vit dans
   adspy/data/db.json + adspy/data/creatives/.

   Le fichier est réécrit de façon atomique (tmp + rename)
   pour ne jamais laisser une base tronquée si le process
   est tué pendant une écriture.
   ========================================================= */

const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const CREATIVES_DIR = path.join(DATA_DIR, 'creatives');

const EMPTY_DB = {
  version: 1,
  ads: {},      // archiveId -> ad normalisée
  brands: {},   // pageId    -> { pageId, pageName, pageUrl, profilePic, firstSeen, lastSeen, notes, tags }
  runs: [],     // historique des collectes { at, source, query, country, added, updated }
  settings: {
    country: 'BE',
    docId: null,        // doc_id GraphQL mémorisé (rafraîchi automatiquement)
    docIdCheckedAt: 0,
  },
};

let db = null;
let writeQueue = Promise.resolve();

function ensureDirs() {
  fssync.mkdirSync(DATA_DIR, { recursive: true });
  fssync.mkdirSync(CREATIVES_DIR, { recursive: true });
}

async function load() {
  if (db) return db;
  ensureDirs();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    db = { ...structuredClone(EMPTY_DB), ...parsed };
    db.settings = { ...EMPTY_DB.settings, ...(parsed.settings || {}) };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // Base corrompue : on la met de côté plutôt que de l'écraser en silence.
      const backup = `${DB_FILE}.corrupt-${Date.now()}`;
      try { await fs.rename(DB_FILE, backup); } catch { /* rien à sauver */ }
      console.warn(`[store] db.json illisible (${err.message}) — sauvegardé dans ${path.basename(backup)}`);
    }
    db = structuredClone(EMPTY_DB);
  }
  return db;
}

/** Écritures sérialisées : pas de course entre deux collectes simultanées. */
function save() {
  writeQueue = writeQueue.then(async () => {
    ensureDirs();
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 1));
    await fs.rename(tmp, DB_FILE);
  }).catch(err => console.error('[store] échec écriture:', err.message));
  return writeQueue;
}

/* ---------------------------------------------------------
   Insertion d'un lot d'annonces normalisées.

   Une annonce déjà connue n'est pas écrasée bêtement : on
   conserve firstSeen (notre plus ancienne observation) et on
   empile un point d'historique quand une métrique bouge.
   C'est ce qui permet de tracer l'évolution d'une créa dans
   le temps — la donnée que l'Ad Library ne garde pas.
   --------------------------------------------------------- */
async function upsertAds(ads, meta = {}) {
  await load();
  const now = Date.now();
  let added = 0;
  let updated = 0;

  for (const ad of ads) {
    if (!ad || !ad.archiveId) continue;
    const prev = db.ads[ad.archiveId];

    if (!prev) {
      ad.firstSeen = now;
      ad.lastSeen = now;
      ad.history = [{ at: now, active: ad.active, variations: ad.variations, reach: ad.reach }];
      db.ads[ad.archiveId] = ad;
      added++;
    } else {
      const changed =
        prev.active !== ad.active ||
        prev.variations !== ad.variations ||
        prev.reach !== ad.reach;

      const history = prev.history || [];
      if (changed) {
        history.push({ at: now, active: ad.active, variations: ad.variations, reach: ad.reach });
      }

      db.ads[ad.archiveId] = {
        ...prev,
        ...ad,
        firstSeen: prev.firstSeen || now,
        lastSeen: now,
        // Les notes/favoris posés par l'utilisateur survivent à une recollecte.
        starred: prev.starred || false,
        notes: prev.notes || '',
        history: history.slice(-200),
      };
      updated++;
    }

    // Fiche marque
    if (ad.pageId) {
      const brand = db.brands[ad.pageId] || {
        pageId: ad.pageId,
        firstSeen: now,
        tags: [],
        notes: '',
      };
      brand.pageName = ad.pageName || brand.pageName;
      brand.pageUrl = ad.pageUrl || brand.pageUrl;
      brand.profilePic = ad.profilePic || brand.profilePic;
      brand.website = ad.linkDomain || brand.website;
      brand.lastSeen = now;
      db.brands[ad.pageId] = brand;
    }
  }

  db.runs.push({
    at: now,
    source: meta.source || 'inconnu',
    query: meta.query || '',
    country: meta.country || '',
    added,
    updated,
  });
  db.runs = db.runs.slice(-500);

  await save();
  return { added, updated, total: Object.keys(db.ads).length };
}

async function getDb() {
  return load();
}

async function allAds() {
  await load();
  return Object.values(db.ads);
}

async function allBrands() {
  await load();
  const ads = Object.values(db.ads);
  return Object.values(db.brands).map(brand => {
    const brandAds = ads.filter(a => a.pageId === brand.pageId);
    const active = brandAds.filter(a => a.active);
    return {
      ...brand,
      adCount: brandAds.length,
      activeCount: active.length,
      lastAdStart: brandAds.reduce((max, a) => Math.max(max, a.startDate || 0), 0),
      medianDaysActive: median(active.map(a => a.daysActive).filter(n => Number.isFinite(n))),
    };
  }).sort((a, b) => b.activeCount - a.activeCount);
}

async function updateAd(archiveId, patch) {
  await load();
  const ad = db.ads[archiveId];
  if (!ad) return null;
  Object.assign(ad, patch);
  await save();
  return ad;
}

async function updateBrand(pageId, patch) {
  await load();
  const brand = db.brands[pageId];
  if (!brand) return null;
  Object.assign(brand, patch);
  await save();
  return brand;
}

async function deleteBrand(pageId) {
  await load();
  delete db.brands[pageId];
  for (const [id, ad] of Object.entries(db.ads)) {
    if (ad.pageId === pageId) delete db.ads[id];
  }
  await save();
}

async function getSettings() {
  await load();
  return db.settings;
}

async function setSettings(patch) {
  await load();
  Object.assign(db.settings, patch);
  await save();
  return db.settings;
}

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

module.exports = {
  DATA_DIR,
  CREATIVES_DIR,
  getDb,
  upsertAds,
  allAds,
  allBrands,
  updateAd,
  updateBrand,
  deleteBrand,
  getSettings,
  setSettings,
  median,
};
