'use strict';

/* =========================================================
   HAR — import d'un export réseau du navigateur.

   Chemin de secours qui marche toujours, même si Meta bloque
   tout appel automatisé : dans l'onglet Réseau des DevTools,
   « Exporter le HAR », on dépose le fichier dans l'app, on
   récupère toutes les annonces que la page avait chargées.
   ========================================================= */

const { extractAdsFromPayload, parseMetaJson } = require('./normalize');

function adsFromHar(harText) {
  let har;
  try {
    har = JSON.parse(harText);
  } catch {
    throw new Error('Fichier HAR illisible (JSON invalide).');
  }

  const entries = har?.log?.entries;
  if (!Array.isArray(entries)) throw new Error('Ce fichier ne ressemble pas à un HAR (log.entries manquant).');

  const ads = [];
  const seen = new Set();

  for (const entry of entries) {
    const url = entry?.request?.url || '';
    if (!/facebook\.com\/(api\/graphql|ads\/library)/.test(url)) continue;

    const content = entry?.response?.content;
    if (!content?.text) continue;
    if (content.encoding === 'base64') continue;   // corps binaire : rien à lire

    for (const payload of parseMetaJson(content.text)) {
      for (const ad of extractAdsFromPayload(payload)) {
        if (seen.has(ad.archiveId)) continue;
        seen.add(ad.archiveId);
        ads.push(ad);
      }
    }
  }

  return ads;
}

module.exports = { adsFromHar };
