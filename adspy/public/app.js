'use strict';

/* =========================================================
   ADSPY — logique de l'interface

   Tout le contenu affiché vient de Meta : il est traité comme
   du texte non fiable et échappé systématiquement (esc()).
   Aucune chaîne provenant d'une annonce n'est injectée en HTML
   brut, sous peine de faire tourner le script d'un annonceur
   dans l'app.
   ========================================================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const state = {
  ads: [],
  total: 0,
  offset: 0,
  pageSize: 60,
  brands: [],
  compare: new Set(),
  filters: {
    brand: '', q: '', sort: 'score', status: 'all',
    format: 'all', platform: 'all', minDays: '', starred: '',
  },
};

/* ---------------------------------------------------------
   Utilitaires
   --------------------------------------------------------- */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
}

const mediaUrl = url => (url ? `/api/media?url=${encodeURIComponent(url)}` : '');

/**
 * Neutralise une URL venant de Meta avant de la mettre dans un href :
 * un `javascript:` glissé dans un champ d'annonce s'exécuterait au clic.
 */
function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function formatNumber(num) {
  if (!Number.isFinite(num)) return '—';
  if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace('.0', '')} M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1).replace('.0', '')} k`;
  return String(num);
}

function formatDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function scoreClass(score) {
  return score >= 70 ? 'is-hot' : score >= 40 ? 'is-warm' : '';
}

let toastTimer;
function toast(message, duration = 2600) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, duration);
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const isJson = (res.headers.get('content-type') || '').includes('json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) throw Object.assign(new Error(payload.error || `Erreur ${res.status}`), payload);
  return payload;
}

async function copyToClipboard(text, message = 'Copié !') {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    // Repli quand le presse-papiers est refusé (page non sécurisée, permission).
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    toast(message);
  }
}

/* =========================================================
   COLLECTE
   ========================================================= */
$('#searchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = $('#searchInput').value.trim();
  if (!query) return toast('Indique une marque à espionner.');

  const button = $('#searchBtn');
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> Collecte…';
  showStatus(`Recherche de « ${query} » dans l'Ad Library…`, '');

  try {
    const result = await api('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        country: $('#countrySelect').value,
        activeStatus: $('#statusSelect').value,
        limit: 30,
      }),
    });

    showStatus(
      `${result.found} annonce(s) récupérée(s) — ${result.added} nouvelle(s), ${result.updated} mise(s) à jour. Source : ${result.source}.`,
      'is-ok'
    );
    await refreshAll();
  } catch (err) {
    showStatus(err.message, 'is-error', err.hint);
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

function showStatus(message, className = '', hint = '') {
  const el = $('#runStatus');
  el.hidden = false;
  el.className = `run-status ${className}`;
  el.innerHTML = esc(message) + (hint ? `<span class="hint">${esc(hint)}</span>` : '');
}

/* =========================================================
   FILTRES
   ========================================================= */
function bindChips(containerId, key) {
  $(`#${containerId}`).addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    $$('.chip', chip.parentElement).forEach(item => item.classList.remove('is-active'));
    chip.classList.add('is-active');
    state.filters[key] = chip.dataset.value;
    reloadAds();
  });
}

bindChips('filterStatus', 'status');
bindChips('filterFormat', 'format');
bindChips('filterPlatform', 'platform');

$('#filterBrand').addEventListener('change', (e) => { state.filters.brand = e.target.value; reloadAds(); });
$('#filterSort').addEventListener('change', (e) => { state.filters.sort = e.target.value; reloadAds(); });
$('#filterStarred').addEventListener('change', (e) => { state.filters.starred = e.target.checked ? '1' : ''; reloadAds(); });

$('#filterMinDays').addEventListener('input', (e) => {
  $('#minDaysValue').textContent = e.target.value;
  state.filters.minDays = e.target.value === '0' ? '' : e.target.value;
  debouncedReload();
});

$('#filterSearch').addEventListener('input', (e) => {
  state.filters.q = e.target.value;
  debouncedReload();
});

let debounceTimer;
function debouncedReload() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(reloadAds, 280);
}

$('#resetFiltersBtn').addEventListener('click', () => {
  state.filters = { brand: '', q: '', sort: 'score', status: 'all', format: 'all', platform: 'all', minDays: '', starred: '' };
  $('#filterBrand').value = '';
  $('#filterSearch').value = '';
  $('#filterSort').value = 'score';
  $('#filterStarred').checked = false;
  $('#filterMinDays').value = 0;
  $('#minDaysValue').textContent = '0';
  ['filterStatus', 'filterFormat', 'filterPlatform'].forEach(id => {
    $$(`#${id} .chip`).forEach((chip, index) => chip.classList.toggle('is-active', index === 0));
  });
  reloadAds();
});

function filterQuery(extra = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...state.filters, ...extra })) {
    if (value !== '' && value !== undefined) params.set(key, value);
  }
  return params;
}

$('#exportAdsBtn').addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = `/api/export/ads.csv?${filterQuery()}`;
});

/* =========================================================
   AFFICHAGE DES PUBS
   ========================================================= */
async function reloadAds({ append = false } = {}) {
  state.offset = append ? state.offset + state.pageSize : 0;
  const params = filterQuery({ limit: state.pageSize, offset: state.offset });
  const data = await api(`/api/ads?${params}`);

  state.total = data.total;
  state.ads = append ? [...state.ads, ...data.ads] : data.ads;
  renderAds();
}

function renderAds() {
  const grid = $('#adsGrid');
  const empty = $('#emptyState');

  $('#resultsCount').innerHTML = state.total
    ? `<strong>${state.total}</strong> annonce(s) — affichage de ${state.ads.length}`
    : 'Aucune annonce pour ces filtres';

  empty.hidden = state.total > 0;
  grid.innerHTML = state.ads.map(adCard).join('');
  $('#loadMoreBtn').hidden = state.ads.length >= state.total;
}

function adCard(ad) {
  const creative = (ad.creatives || [])[0];
  const thumb = creative && (creative.thumb || creative.image);
  const isVideo = ad.format === 'video';

  const media = thumb
    ? `<img src="${mediaUrl(thumb)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ad-media-empty',textContent:'Visuel expiré chez Meta'}))" />`
    : `<div class="ad-media-empty">Pas de visuel disponible</div>`;

  const platforms = (ad.platforms || [])
    .map(p => ({ FACEBOOK: 'FB', INSTAGRAM: 'IG', MESSENGER: 'MSG', AUDIENCE_NETWORK: 'AN', THREADS: 'TH' }[p] || p))
    .join(' · ');

  return `
    <article class="ad-card" data-id="${esc(ad.archiveId)}">
      <div class="ad-head">
        ${ad.profilePic
          ? `<img class="ad-avatar" src="${mediaUrl(ad.profilePic)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />`
          : `<div class="ad-avatar"></div>`}
        <div class="ad-brand">
          <div class="ad-brand-name">${esc(ad.pageName)}</div>
          <div class="ad-brand-meta">${esc(platforms || '—')}</div>
        </div>
        <div class="score ${scoreClass(ad.score)}" title="Score winner : ${ad.score}/100">${ad.score}</div>
      </div>

      <div class="ad-media" data-action="open">
        ${media}
        <div class="ad-media-badge">${isVideo ? '▶ Vidéo' : ad.format === 'carrousel' ? '❏ Carrousel' : '▣ Image'}</div>
        <button class="ad-star ${ad.starred ? 'is-on' : ''}" data-action="star" title="Mettre en favori">★</button>
      </div>

      <div class="ad-body">
        ${ad.title ? `<div class="ad-title">${esc(ad.title)}</div>` : ''}
        <div class="ad-text">${esc(ad.body || 'Pas de texte.')}</div>
        <div class="ad-stats">
          <span class="stat ${ad.active ? 'is-live' : 'is-off'}">
            ${ad.active ? '● Active' : '○ Terminée'} <strong>${ad.daysActive} j</strong>
          </span>
          ${ad.variations > 1 ? `<span class="stat"><strong>${ad.variations}</strong> copies</span>` : ''}
          ${ad.reach ? `<span class="stat">Portée <strong>${formatNumber(ad.reach)}</strong></span>` : ''}
          ${ad.ctaText ? `<span class="stat">${esc(ad.ctaText)}</span>` : ''}
          ${ad.linkDomain ? `<span class="stat">${esc(ad.linkDomain)}</span>` : ''}
        </div>
      </div>

      <div class="ad-foot">
        <button class="icon-btn" data-action="copy-text">Copier le texte</button>
        <button class="icon-btn" data-action="copy-brief">Copier le brief</button>
        <button class="icon-btn" data-action="open">Détail</button>
      </div>
    </article>`;
}

/* ---------- Actions sur les cartes (délégation) ---------- */
$('#adsGrid').addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-action]');
  const card = event.target.closest('.ad-card');
  if (!trigger || !card) return;

  const ad = state.ads.find(item => item.archiveId === card.dataset.id);
  if (!ad) return;

  switch (trigger.dataset.action) {
    case 'open':
      openAdModal(ad);
      break;

    case 'copy-text':
      copyToClipboard(adAsText(ad), 'Texte de la pub copié.');
      break;

    case 'copy-brief':
      copyToClipboard(adAsBrief(ad), 'Brief créatif copié.');
      break;

    case 'star': {
      event.stopPropagation();
      ad.starred = !ad.starred;
      trigger.classList.toggle('is-on', ad.starred);
      await api('/api/ad', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ archiveId: ad.archiveId, starred: ad.starred }),
      });
      break;
    }
  }
});

$('#loadMoreBtn').addEventListener('click', () => reloadAds({ append: true }));

/* ---------- Formats de copie ---------- */
function adAsText(ad) {
  return [
    ad.title && `TITRE : ${ad.title}`,
    ad.body,
    ad.linkDescription && `DESCRIPTION : ${ad.linkDescription}`,
    ad.ctaText && `BOUTON : ${ad.ctaText}`,
    ad.linkUrl && `DESTINATION : ${ad.linkUrl}`,
  ].filter(Boolean).join('\n\n');
}

/** Bloc prêt à coller dans un brief créatif ou un prompt. */
function adAsBrief(ad) {
  return `BRIEF CRÉATIF — inspiré d'une pub ${ad.pageName}

Format : ${ad.format}${ad.variations > 1 ? ` (${ad.variations} variantes en diffusion)` : ''}
Diffusée depuis : ${ad.daysActive} jours${ad.active ? ' (toujours active)' : ' (terminée)'}
Plateformes : ${(ad.platforms || []).join(', ') || 'non précisé'}
Score winner : ${ad.score}/100

ACCROCHE
${ad.title || '(pas de titre)'}

TEXTE
${ad.body || '(pas de texte)'}

APPEL À L'ACTION
${ad.ctaText || '(aucun)'} → ${ad.linkDomain || ad.linkUrl || '(pas de lien)'}

À REPRODUIRE : l'angle et la structure du message.
À NE PAS REPRODUIRE : le visuel et le texte tels quels, ils appartiennent à ${ad.pageName}.

Source : ${ad.libraryUrl}`;
}

/* =========================================================
   MODALE DE DÉTAIL
   ========================================================= */
function openAdModal(ad) {
  const creatives = ad.creatives || [];

  const renderMedia = (index) => {
    const creative = creatives[index];
    if (!creative) return `<div class="ad-media-empty">Pas de média</div>`;
    if (creative.video) {
      return `<video src="${mediaUrl(creative.video)}" controls playsinline ${creative.image ? `poster="${mediaUrl(creative.image)}"` : ''}></video>`;
    }
    const image = creative.image || creative.thumb;
    return image
      ? `<img src="${mediaUrl(image)}" alt="" />`
      : `<div class="ad-media-empty">Pas de média</div>`;
  };

  const thumbs = creatives.length > 1
    ? `<div class="detail-thumbs">${creatives.map((creative, index) =>
        `<img src="${mediaUrl(creative.thumb || creative.image)}" data-index="${index}" class="${index === 0 ? 'is-active' : ''}" alt="Créa ${index + 1}" />`
      ).join('')}</div>`
    : '';

  const field = (label, value) => value
    ? `<div class="detail-field"><h4>${esc(label)}</h4><p>${esc(value)}</p></div>`
    : '';

  const history = (ad.history || []).length > 1
    ? `<div class="detail-field">
         <h4>Évolution observée</h4>
         <div class="history">${ad.history.slice(-8).reverse().map(point => `
           <div class="history-row">
             <time>${formatDate(point.at)}</time>
             <span>${point.active ? 'active' : 'arrêtée'}${point.variations ? ` · ${point.variations} copie(s)` : ''}${point.reach ? ` · portée ${formatNumber(point.reach)}` : ''}</span>
           </div>`).join('')}
         </div>
       </div>`
    : '';

  $('#modalContent').innerHTML = `
    <div class="detail">
      <div>
        <div class="detail-media" id="detailMedia">${renderMedia(0)}</div>
        ${thumbs}
      </div>

      <div>
        <h2 class="view-title" id="modalTitle">${esc(ad.pageName)}</h2>
        <p class="view-sub">
          ${ad.active ? '● En diffusion' : '○ Terminée'} · ${ad.daysActive} jours ·
          score ${ad.score}/100 · ${ad.variations} copie(s) en parallèle
        </p>

        <div class="detail-actions">
          <button class="btn btn-purple btn-sm" data-copy="text">Copier le texte</button>
          <button class="btn btn-ghost btn-sm" data-copy="brief">Copier le brief</button>
          <button class="btn btn-ghost btn-sm" data-save-creative>Télécharger la créa</button>
          <a class="btn btn-ghost btn-sm" href="${esc(safeUrl(ad.libraryUrl))}" target="_blank" rel="noopener">Voir chez Meta</a>
        </div>

        ${field('Titre', ad.title)}
        ${field('Texte', ad.body)}
        ${field('Description du lien', ad.linkDescription)}
        ${field('Bouton', [ad.ctaText, ad.ctaType].filter(Boolean).join(' · '))}
        ${field('Destination', ad.linkUrl)}
        ${field('Plateformes', (ad.platforms || []).join(', '))}
        ${field('Lancée le', formatDate(ad.startDate))}
        ${ad.endDate ? field('Arrêtée le', formatDate(ad.endDate)) : ''}
        ${ad.reach ? field('Portée déclarée (UE)', formatNumber(ad.reach)) : ''}
        ${field('Vue pour la première fois par ADSPY', formatDate(ad.firstSeen))}
        ${history}

        <div class="detail-field">
          <h4>Mes notes</h4>
          <textarea class="detail-notes" id="adNotes" rows="3" placeholder="Angle utilisé, à tester pour…">${esc(ad.notes || '')}</textarea>
        </div>
      </div>
    </div>`;

  let currentIndex = 0;

  $$('#modalContent .detail-thumbs img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentIndex = Number(thumb.dataset.index);
      $('#detailMedia').innerHTML = renderMedia(currentIndex);
      $$('#modalContent .detail-thumbs img').forEach(item => item.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });

  $$('#modalContent [data-copy]').forEach(button => {
    button.addEventListener('click', () => {
      const isBrief = button.dataset.copy === 'brief';
      copyToClipboard(isBrief ? adAsBrief(ad) : adAsText(ad), isBrief ? 'Brief copié.' : 'Texte copié.');
    });
  });

  $('#modalContent [data-save-creative]').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Téléchargement…';
    try {
      const saved = await api('/api/creative/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ archiveId: ad.archiveId, index: currentIndex }),
      });
      toast(`Enregistré dans adspy/data/creatives/${saved.fileName}`, 4200);
    } catch (err) {
      toast(err.message, 4200);
    } finally {
      button.disabled = false;
      button.textContent = 'Télécharger la créa';
    }
  });

  let notesTimer;
  $('#adNotes').addEventListener('input', (event) => {
    clearTimeout(notesTimer);
    const notes = event.target.value;
    notesTimer = setTimeout(() => {
      ad.notes = notes;
      api('/api/ad', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ archiveId: ad.archiveId, notes }),
      }).catch(() => toast('Note non enregistrée.'));
    }, 600);
  });

  $('#adModal').hidden = false;
}

/* ---------- Fermeture des modales ---------- */
document.addEventListener('click', (event) => {
  if (event.target.matches('[data-close]')) {
    event.target.closest('.modal').hidden = true;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') $$('.modal').forEach(modal => { modal.hidden = true; });
});

/* =========================================================
   ONGLETS
   ========================================================= */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(item => item.classList.remove('is-active'));
    tab.classList.add('is-active');
    $$('.view').forEach(view => view.classList.remove('is-active'));
    $(`#view-${tab.dataset.view}`).classList.add('is-active');

    if (tab.dataset.view === 'compare') renderComparePicker();
    if (tab.dataset.view === 'prospect') renderProspects();
  });
});

/* =========================================================
   COMPARATEUR
   ========================================================= */
function renderComparePicker() {
  $('#comparePicker').innerHTML = state.brands.length
    ? state.brands.map(brand => `
        <button class="chip ${state.compare.has(brand.pageId) ? 'is-active' : ''}" data-page="${esc(brand.pageId)}">
          ${esc(brand.pageName)} <span style="opacity:.6">${brand.activeCount}</span>
        </button>`).join('')
    : '<p class="view-sub">Collecte d\'abord quelques marques.</p>';

  $$('#comparePicker .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const pageId = chip.dataset.page;
      if (state.compare.has(pageId)) state.compare.delete(pageId);
      else if (state.compare.size >= 5) return toast('5 marques maximum à la fois.');
      else state.compare.add(pageId);
      chip.classList.toggle('is-active');
      renderCompare();
    });
  });

  renderCompare();
}

async function renderCompare() {
  const grid = $('#compareGrid');
  if (!state.compare.size) {
    grid.innerHTML = '<p class="view-sub">Sélectionne des marques ci-dessus pour lancer la comparaison.</p>';
    return;
  }

  const data = await api(`/api/compare?brands=${[...state.compare].join(',')}`);
  const maxCadence = Math.max(1, ...data.brands.flatMap(brand => brand.cadence));

  // Les meilleures créas arrivent complètes dans la réponse : on les garde
  // sous la main pour ouvrir le détail sans refaire un appel.
  const topAdsById = new Map(data.brands.flatMap(brand => brand.topAds.map(ad => [ad.archiveId, ad])));

  grid.innerHTML = data.brands.map(brand => {
    const totalFormats = Math.max(1, brand.formatMix.video + brand.formatMix.image + brand.formatMix.carrousel);
    const bar = (label, value) => `
      <div class="bar-row">
        <span>${label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.round((value / totalFormats) * 100)}%"></span></span>
        <span>${value}</span>
      </div>`;

    return `
      <div class="compare-card">
        <div class="compare-brand">
          ${brand.profilePic ? `<img src="${mediaUrl(brand.profilePic)}" alt="" onerror="this.style.visibility='hidden'" />` : '<img alt="" />'}
          <div>
            <h3>${esc(brand.pageName)}</h3>
            <p class="metric-label">${brand.totalAds} pub(s) connue(s)</p>
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric">
            <div class="metric-value is-accent">${brand.activeAds}</div>
            <div class="metric-label">pubs actives</div>
          </div>
          <div class="metric">
            <div class="metric-value">${brand.medianDays} j</div>
            <div class="metric-label">ancienneté médiane</div>
          </div>
          <div class="metric">
            <div class="metric-value">${brand.maxDays} j</div>
            <div class="metric-label">créa la plus ancienne</div>
          </div>
          <div class="metric">
            <div class="metric-value">${brand.newLast30d}</div>
            <div class="metric-label">lancées sur 30 jours</div>
          </div>
        </div>

        <div>
          <div class="mini-title">Répartition des formats</div>
          ${bar('Vidéo', brand.formatMix.video)}
          ${bar('Image', brand.formatMix.image)}
          ${bar('Carrousel', brand.formatMix.carrousel)}
        </div>

        <div>
          <div class="mini-title">Rythme de lancement (12 semaines)</div>
          ${sparkline(brand.cadence, maxCadence)}
        </div>

        ${brand.topCtas.length ? `
          <div>
            <div class="mini-title">Boutons les plus utilisés</div>
            <div class="ad-stats">
              ${brand.topCtas.map(([cta, count]) => `<span class="stat">${esc(cta)} <strong>${count}</strong></span>`).join('')}
            </div>
          </div>` : ''}

        <div>
          <div class="mini-title">Ses meilleures créas</div>
          ${brand.topAds.map(ad => {
            const thumb = (ad.creatives || [])[0];
            const src = thumb && (thumb.thumb || thumb.image);
            return `
              <div class="compare-top-ad" data-ad="${esc(ad.archiveId)}">
                ${src ? `<img src="${mediaUrl(src)}" alt="" onerror="this.style.visibility='hidden'" />` : '<img alt="" />'}
                <div>
                  <p><strong>${ad.score}/100</strong> · ${ad.daysActive} j</p>
                  <p>${esc((ad.body || ad.title || '').slice(0, 60))}</p>
                </div>
              </div>`;
          }).join('') || '<p class="metric-label">Aucune créa.</p>'}
        </div>
      </div>`;
  }).join('');

  // Ouvrir une créa depuis le comparateur.
  $$('#compareGrid .compare-top-ad').forEach(row => {
    row.addEventListener('click', () => {
      const ad = topAdsById.get(row.dataset.ad);
      if (ad) openAdModal(ad);
    });
  });
}

/** Petit graphe en barres, dessiné à la main : pas de librairie externe. */
function sparkline(values, max) {
  const width = 100;
  const height = 42;
  const gap = 2;
  const barWidth = (width - gap * (values.length - 1)) / values.length;

  const bars = values.map((value, index) => {
    const barHeight = Math.max(2, (value / max) * (height - 4));
    const x = index * (barWidth + gap);
    const y = height - barHeight;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="1" fill="${value ? '#8B5CF6' : '#2A2A31'}"><title>${value} pub(s)</title></rect>`;
  }).join('');

  return `<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Nombre de pubs lancées par semaine">${bars}</svg>`;
}

/* =========================================================
   PROSPECTION
   ========================================================= */
function renderProspects() {
  const body = $('#prospectBody');

  if (!state.brands.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-faint);padding:40px">Aucun annonceur pour l\'instant.</td></tr>';
    return;
  }

  body.innerHTML = state.brands.map(brand => `
    <tr data-page="${esc(brand.pageId)}">
      <td>
        <div class="table-brand">
          ${brand.profilePic ? `<img src="${mediaUrl(brand.profilePic)}" alt="" onerror="this.style.visibility='hidden'" />` : '<img alt="" />'}
          <div>
            <div style="font-weight:600">${esc(brand.pageName || '—')}</div>
            ${brand.pageUrl ? `<a href="${esc(safeUrl(brand.pageUrl))}" target="_blank" rel="noopener" style="font-size:11px">page Facebook</a>` : ''}
          </div>
        </div>
      </td>
      <td class="num"><span class="pill">${brand.activeCount}</span></td>
      <td class="num">${brand.adCount}</td>
      <td class="num">${brand.medianDaysActive} j</td>
      <td>${formatDate(brand.lastAdStart)}</td>
      <td>${brand.website ? `<a href="${esc(safeUrl('https://' + brand.website))}" target="_blank" rel="noopener">${esc(brand.website)}</a>` : '—'}</td>
      <td><input class="note-input" value="${esc(brand.notes || '')}" placeholder="À rappeler, contacté le…" /></td>
      <td><button class="delete-btn" title="Retirer cette marque et ses pubs">🗑</button></td>
    </tr>`).join('');

  $$('#prospectBody tr').forEach(row => {
    const pageId = row.dataset.page;

    let noteTimer;
    $('.note-input', row).addEventListener('input', (event) => {
      clearTimeout(noteTimer);
      const notes = event.target.value;
      noteTimer = setTimeout(() => {
        api('/api/brand', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pageId, notes }),
        }).catch(() => toast('Note non enregistrée.'));
      }, 600);
    });

    $('.delete-btn', row).addEventListener('click', async () => {
      const brand = state.brands.find(item => item.pageId === pageId);
      if (!confirm(`Supprimer « ${brand?.pageName || pageId} » et toutes ses pubs de ta bibliothèque ?`)) return;
      await api('/api/brand', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });
      state.compare.delete(pageId);
      await refreshAll();
      renderProspects();
      toast('Marque supprimée.');
    });
  });
}

/* =========================================================
   MODALES SECONDAIRES
   ========================================================= */
async function openBrowserModal() {
  $('#browserModal').hidden = false;
  try {
    const data = await api('/api/bookmarklet');
    const link = $('#bookmarkletLink');
    link.href = data.bookmarklet;
    link.onclick = (event) => {
      event.preventDefault();
      toast('Fais glisser ce bouton dans ta barre de favoris (un clic ici ne fait rien).', 4000);
    };
    $('#copyBookmarklet').onclick = () => copyToClipboard(data.bookmarklet, 'Code du marque-page copié.');
  } catch {
    toast('Impossible de générer le marque-page.');
  }
}

$('#browserModeBtn').addEventListener('click', openBrowserModal);
$('#emptyBrowserMode').addEventListener('click', openBrowserModal);
$('#importBtn').addEventListener('click', () => { $('#importModal').hidden = false; });

$('#harInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  showImportResult('Lecture du fichier…', '');
  try {
    const text = await file.text();
    const result = await api('/api/import/har', { method: 'POST', body: text });
    showImportResult(
      result.found
        ? `${result.found} annonce(s) trouvée(s) — ${result.added} nouvelle(s).`
        : (result.note || 'Aucune annonce trouvée.'),
      result.found ? 'is-ok' : 'is-error'
    );
    await refreshAll();
  } catch (err) {
    showImportResult(err.message, 'is-error');
  }
});

$('#importJsonBtn').addEventListener('click', async () => {
  const text = $('#jsonInput').value.trim();
  if (!text) return showImportResult('Colle d\'abord du JSON.', 'is-error');
  try {
    const result = await api('/api/import/json', { method: 'POST', body: text });
    showImportResult(`${result.found} annonce(s) importée(s) — ${result.added} nouvelle(s).`, 'is-ok');
    $('#jsonInput').value = '';
    await refreshAll();
  } catch (err) {
    showImportResult(err.message, 'is-error');
  }
});

function showImportResult(message, className) {
  const el = $('#importResult');
  el.hidden = false;
  el.className = `import-result ${className}`;
  el.textContent = message;
}

/* =========================================================
   MISE EN PAGE
   ========================================================= */

/**
 * Publie la hauteur réelle de la barre collante dans --topbar-h.
 * Cette hauteur change avec la largeur de la fenêtre (le formulaire
 * passe sur deux lignes) et avec l'apparition du bandeau de statut :
 * la mesurer évite que la barre recouvre le contenu — et intercepte
 * les clics — quand la valeur codée en dur ne correspond plus.
 */
function syncStickyHeight() {
  const height = $('#stickybar').offsetHeight;
  document.documentElement.style.setProperty('--topbar-h', `${height}px`);
}

new ResizeObserver(syncStickyHeight).observe($('#stickybar'));
window.addEventListener('resize', syncStickyHeight);
syncStickyHeight();

/* =========================================================
   DÉMARRAGE
   ========================================================= */
async function refreshAll() {
  const data = await api('/api/state');
  state.brands = data.brands;

  $('#countAds').textContent = data.counts.ads;
  $('#countBrands').textContent = data.counts.brands;

  const select = $('#filterBrand');
  const previous = select.value;
  select.innerHTML = '<option value="">Toutes les marques</option>'
    + data.brands.map(brand =>
        `<option value="${esc(brand.pageId)}">${esc(brand.pageName)} (${brand.adCount})</option>`
      ).join('');
  select.value = previous;

  if (data.settings.country) $('#countrySelect').value = data.settings.country;

  await reloadAds();
}

refreshAll().catch(err => showStatus(`Impossible de charger les données : ${err.message}`, 'is-error'));
