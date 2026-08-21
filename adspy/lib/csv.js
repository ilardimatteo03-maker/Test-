'use strict';

/* =========================================================
   CSV — exports ouvrables directement dans Excel / Sheets.
   Séparateur point-virgule + BOM UTF-8 : sans ça Excel FR
   colle tout dans une seule colonne et casse les accents.
   ========================================================= */

const SEP = ';';

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r?\n/g, ' ').trim();
  return /[";]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.map(col => escapeCell(col.label)).join(SEP);
  const body = rows.map(row =>
    columns.map(col => escapeCell(typeof col.value === 'function' ? col.value(row) : row[col.value])).join(SEP)
  );
  return '﻿' + [header, ...body].join('\r\n');
}

const formatDate = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');

/** Export « analyse de pubs » : une ligne par annonce. */
function adsCsv(ads) {
  return toCsv(ads, [
    { label: 'Marque', value: 'pageName' },
    { label: 'Score winner', value: 'score' },
    { label: 'Active', value: ad => (ad.active ? 'oui' : 'non') },
    { label: 'Jours de diffusion', value: 'daysActive' },
    { label: 'Debut', value: ad => formatDate(ad.startDate) },
    { label: 'Fin', value: ad => formatDate(ad.endDate) },
    { label: 'Duplications', value: 'variations' },
    { label: 'Format', value: 'format' },
    { label: 'Plateformes', value: ad => (ad.platforms || []).join(', ') },
    { label: 'Accroche (titre)', value: 'title' },
    { label: 'Texte', value: 'body' },
    { label: 'CTA', value: 'ctaText' },
    { label: 'Destination', value: 'linkUrl' },
    { label: 'Domaine', value: 'linkDomain' },
    { label: 'Portee estimee', value: 'reach' },
    { label: 'Lien Ad Library', value: 'libraryUrl' },
  ]);
}

/** Export « prospection » : une ligne par annonceur. */
function leadsCsv(brands) {
  return toCsv(brands, [
    { label: 'Annonceur', value: 'pageName' },
    { label: 'Site', value: 'website' },
    { label: 'Page Facebook', value: 'pageUrl' },
    { label: 'Pubs actives', value: 'activeCount' },
    { label: 'Pubs vues au total', value: 'adCount' },
    { label: 'Anciennete mediane des pubs (jours)', value: 'medianDaysActive' },
    { label: 'Derniere pub lancee', value: brand => formatDate(brand.lastAdStart) },
    { label: 'Tags', value: brand => (brand.tags || []).join(', ') },
    { label: 'Notes', value: 'notes' },
  ]);
}

module.exports = { toCsv, adsCsv, leadsCsv };
