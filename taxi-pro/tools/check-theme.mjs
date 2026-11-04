// Contrôle complet du thème TAXI PRO.
//   1. Theme Check officiel de Shopify (@shopify/theme-check-node).
//   2. Validation maison des valeurs enregistrées (modèles JSON, groupes de sections, settings_data)
//      contre les schémas : Shopify refuse silencieusement à l'import un modèle dont une valeur est hors
//      schéma (option de liste inexistante, curseur hors bornes…), ce que Theme Check ne signale pas.
//   3. Curseurs d'au moins 4 positions, clés de traduction existantes, langues complètes,
//      snippets et icônes référencés présents, JSON de configuration bien formé.
// Usage : node taxi-pro/tools/check-theme.mjs   (code de sortie 1 en cas d'erreur)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = join(ROOT, 'theme');
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file} : ${msg}`);
const warn = (file, msg) => warnings.push(`${file} : ${msg}`);
const read = (p) => readFileSync(join(THEME, p), 'utf8');
const list = (dir, ext) => {
  const out = [];
  const walk = (d) => readdirSync(join(THEME, d)).forEach((f) => {
    const p = join(d, f);
    if (statSync(join(THEME, p)).isDirectory()) walk(p); else if (!ext || f.endsWith(ext)) out.push(p);
  });
  walk(dir);
  return out;
};

/* ---------- 1. Theme Check ---------- */
let themeCheckOk = true;
try {
  const { themeCheckRun } = await import('@shopify/theme-check-node');
  const run = await themeCheckRun(THEME, undefined, () => {});
  const offenses = run.offenses || [];
  const sev = ['ERREUR', 'AVERTISSEMENT', 'INFO'];
  for (const o of offenses) {
    const file = relative(THEME, fileURLToPath(o.uri));
    const line = o.start ? o.start.line + 1 : '?';
    const msg = `[${o.check}] ${o.message} (ligne ${line})`;
    if (o.severity === 0) err(file, msg); else if (o.severity === 1) warn(file, msg);
  }
  console.log(`Theme Check : ${offenses.filter((o) => o.severity === 0).length} erreur(s), ${offenses.filter((o) => o.severity === 1).length} avertissement(s)`);
} catch (e) {
  themeCheckOk = false;
  warn('theme-check', `non exécuté (${e.message}). Lancez « npm install » dans taxi-pro/tools.`);
}

/* ---------- Schémas ---------- */
const schemas = {};
for (const f of list('sections', '.liquid')) {
  const src = read(f);
  const m = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(src);
  if (!m) { err(f, 'schéma absent'); continue; }
  try { schemas[f.replace(/^sections\//, '').replace(/\.liquid$/, '')] = JSON.parse(m[1]); }
  catch (e) { err(f, `schéma JSON invalide : ${e.message}`); }
}
const globalSchema = JSON.parse(read('config/settings_schema.json'));
const globalSettings = globalSchema.flatMap((g) => g.settings || []);

function checkSettingDefs(file, settings) {
  const ids = new Set();
  for (const s of settings || []) {
    if (!s.id) continue;
    if (ids.has(s.id)) err(file, `identifiant de réglage en double : ${s.id}`);
    ids.add(s.id);
    if (s.type === 'range') {
      const steps = (s.max - s.min) / s.step + 1;
      if (steps < 4) err(file, `curseur « ${s.id} » à ${steps} position(s) : Shopify peut refuser la section (utilisez une liste)`);
      if (steps > 101) err(file, `curseur « ${s.id} » : plus de 101 positions`);
      if (s.default !== undefined && (s.default < s.min || s.default > s.max || Math.abs(((s.default - s.min) / s.step) - Math.round((s.default - s.min) / s.step)) > 1e-9))
        err(file, `curseur « ${s.id} » : valeur par défaut ${s.default} hors pas ou bornes`);
    }
    if ((s.type === 'select' || s.type === 'radio') && s.default !== undefined && !s.options.some((o) => o.value === s.default))
      err(file, `liste « ${s.id} » : valeur par défaut « ${s.default} » absente des options`);
    if (s.type === 'number' && s.default !== undefined && typeof s.default !== 'number') err(file, `nombre « ${s.id} » : défaut non numérique`);
  }
}
checkSettingDefs('config/settings_schema.json', globalSettings);
for (const [name, sc] of Object.entries(schemas)) {
  checkSettingDefs(`sections/${name}.liquid`, sc.settings);
  for (const b of sc.blocks || []) checkSettingDefs(`sections/${name}.liquid (bloc ${b.type})`, b.settings);
  if (sc.name && sc.name.length > 25) warn(`sections/${name}.liquid`, `nom de section de plus de 25 caractères`);
}

/* ---------- 2. Valeurs enregistrées ---------- */
function checkValue(file, where, def, value) {
  if (!def) { err(file, `${where} : réglage inconnu`); return; }
  if (value === null || value === undefined) return;
  if (value === '' && !file.startsWith('config/')) { err(file, `${where} : valeur vide (Shopify peut refuser le modèle à l'import) : supprimez la clé`); return; }
  switch (def.type) {
    case 'select': case 'radio':
      if (!def.options.some((o) => o.value === value)) err(file, `${where} : « ${value} » n'est pas une option de ${def.id}`);
      break;
    case 'range':
      if (typeof value !== 'number' || value < def.min || value > def.max || Math.abs(((value - def.min) / def.step) - Math.round((value - def.min) / def.step)) > 1e-9)
        err(file, `${where} : ${value} hors bornes ou hors pas (${def.min}–${def.max}, pas ${def.step})`);
      break;
    case 'checkbox': if (typeof value !== 'boolean') err(file, `${where} : booléen attendu`); break;
    case 'number': if (typeof value !== 'number') err(file, `${where} : nombre attendu`); break;
    case 'text': case 'textarea': case 'richtext': case 'inline_richtext': case 'url': case 'liquid':
      if (typeof value !== 'string') err(file, `${where} : texte attendu`);
      if (def.type === 'richtext' && value && !/^<(p|ul|ol|h[1-6])[\s>]/.test(value)) err(file, `${where} : le texte riche doit commencer par <p>, <ul>, <ol> ou un titre`);
      break;
    default: break;
  }
}
function checkSectionData(file, key, data, groupType) {
  const sc = schemas[data.type];
  if (!sc) { err(file, `section « ${key} » : type « ${data.type} » introuvable`); return; }
  if (groupType && sc.enabled_on && sc.enabled_on.groups && !sc.enabled_on.groups.includes(groupType) && !sc.enabled_on.groups.includes('*'))
    err(file, `section « ${key} » (${data.type}) non autorisée dans le groupe ${groupType}`);
  if (!groupType && sc.enabled_on && !sc.enabled_on.templates) err(file, `section « ${key} » (${data.type}) réservée à un groupe`);
  const defs = Object.fromEntries((sc.settings || []).filter((s) => s.id).map((s) => [s.id, s]));
  for (const [id, v] of Object.entries(data.settings || {})) checkValue(file, `${key}.${id}`, defs[id], v);
  const blocks = data.blocks || {};
  const order = data.block_order || [];
  if (sc.max_blocks && order.length > sc.max_blocks) err(file, `section « ${key} » : ${order.length} blocs pour un maximum de ${sc.max_blocks}`);
  if (order.length > 50) err(file, `section « ${key} » : plus de 50 blocs`);
  for (const id of order) if (!blocks[id]) err(file, `section « ${key} » : bloc « ${id} » listé mais absent`);
  for (const [bid, b] of Object.entries(blocks)) {
    const bs = (sc.blocks || []).find((x) => x.type === b.type);
    if (!bs) { err(file, `${key}/${bid} : type de bloc « ${b.type} » inconnu`); continue; }
    const bdefs = Object.fromEntries((bs.settings || []).filter((s) => s.id).map((s) => [s.id, s]));
    for (const [id, v] of Object.entries(b.settings || {})) checkValue(file, `${key}/${bid}.${id}`, bdefs[id], v);
  }
}
for (const f of list('templates', '.json')) {
  const t = JSON.parse(read(f));
  if (Object.keys(t.sections).length > 25) err(f, 'plus de 25 sections');
  for (const id of t.order) if (!t.sections[id]) err(f, `section « ${id} » listée mais absente`);
  for (const [k, d] of Object.entries(t.sections)) checkSectionData(f, k, d, null);
}
for (const f of list('sections', '.json')) {
  const g = JSON.parse(read(f));
  for (const id of g.order) if (!g.sections[id]) err(f, `section « ${id} » listée mais absente`);
  for (const [k, d] of Object.entries(g.sections)) checkSectionData(f, k, d, g.type);
}
// settings_data : valeurs courantes et préréglages
const sdata = JSON.parse(read('config/settings_data.json'));
const gdefs = Object.fromEntries(globalSettings.filter((s) => s.id).map((s) => [s.id, s]));
const fontOk = (v) => typeof v === 'string' && /^[a-z0-9_]+_[ni][1-9]$|^(serif|mono|sans_serif_[ni][47]|system_ui_[ni][47])$/.test(v);
for (const [label, values] of [['current', sdata.current], ...Object.entries(sdata.presets || {}).map(([k, v]) => [`preset ${k}`, v])]) {
  if (typeof values !== 'object') continue;
  for (const [id, v] of Object.entries(values)) {
    if (id === 'sections' || id === 'content_for_index' || id === 'blocks') continue;
    const def = gdefs[id];
    if (def && def.type === 'font_picker') { if (!fontOk(v)) err('config/settings_data.json', `${label}.${id} : police « ${v} » invalide`); continue; }
    checkValue('config/settings_data.json', `${label}.${id}`, def, v);
  }
}
for (const name of Object.keys(sdata.presets || {})) {
  if (!/^[A-Za-z][A-Za-z ]{0,29}$/.test(name) || name.split(' ').length > 2) warn('config/settings_data.json', `nom de préréglage « ${name} » non conforme aux recommandations Shopify`);
}

/* ---------- 3. Traductions, snippets, icônes ---------- */
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const fr = JSON.parse(read('locales/fr.default.json'));
const frKeys = new Set(flat(fr));
const liquidFiles = [...list('sections', '.liquid'), ...list('snippets', '.liquid'), ...list('layout', '.liquid'), ...list('templates', '.liquid')];
const iconSrc = read('snippets/icon.liquid');
const icons = new Set([...iconSrc.matchAll(/when '([a-z-]+)'/g)].map((m) => m[1]));
for (const f of liquidFiles) {
  const src = read(f);
  for (const m of src.matchAll(/'([a-z0-9_]+(?:\.[a-z0-9_]+)+)'\s*\|\s*t\b/g)) if (!frKeys.has(m[1])) err(f, `clé de traduction manquante : ${m[1]}`);
  for (const m of src.matchAll(/render\s+'([a-z0-9-]+)'/g)) if (!existsSync(join(THEME, 'snippets', `${m[1]}.liquid`))) err(f, `snippet introuvable : ${m[1]}`);
  for (const m of src.matchAll(/render 'icon', name: '([a-z-]+)'/g)) if (!icons.has(m[1])) err(f, `icône inconnue : ${m[1]}`);
  for (const m of src.matchAll(/\|\s*t\s*\}\}[^]*?/g)) void m;
  if (/default:\s*'[a-z_]+\.[a-z_.]+'\s*\|\s*t\b/.test(src)) err(f, `« default: 'clé' | t » traduit la valeur choisie par le marchand : assignez d'abord la traduction`);
}
// Valeurs d'icônes proposées dans les schémas
for (const [name, sc] of Object.entries(schemas)) {
  const all = [...(sc.settings || []), ...(sc.blocks || []).flatMap((b) => b.settings || [])];
  for (const s of all) if (s.id === 'icon' && s.options) for (const o of s.options) if (!icons.has(o.value)) err(`sections/${name}.liquid`, `option d'icône sans dessin : ${o.value}`);
}
for (const f of readdirSync(join(THEME, 'locales')).filter((x) => x.endsWith('.json') && x !== 'fr.default.json')) {
  const keys = new Set(flat(JSON.parse(read(`locales/${f}`))));
  for (const k of frKeys) if (!keys.has(k)) err(`locales/${f}`, `clé absente : ${k}`);
  for (const k of keys) if (!frKeys.has(k)) warn(`locales/${f}`, `clé inconnue de la langue par défaut : ${k}`);
}
// tp-strings.liquid à jour
const strings = read('snippets/tp-strings.liquid');
for (const k of Object.keys(fr.taxi.booking)) if (!strings.includes(`'taxi.booking.${k}'`)) err('snippets/tp-strings.liquid', `texte « ${k} » absent : relancez tools/gen-strings.mjs`);
// Pas de clé secrète dans les fichiers publics
for (const f of [...liquidFiles, ...list('assets', '.js'), ...list('config', '.json')]) {
  const src = read(f);
  if (/sk_live_[0-9a-zA-Z]{10,}|shpat_[0-9a-f]{10,}|re_[0-9a-zA-Z]{20,}/.test(src)) err(f, 'clé secrète détectée dans un fichier public');
}

/* ---------- Résultat ---------- */
warnings.forEach((w) => console.log(`  ⚠ ${w}`));
errors.forEach((e) => console.log(`  ✗ ${e}`));
console.log(`\nContrôle du thème : ${errors.length} erreur(s), ${warnings.length} avertissement(s)${themeCheckOk ? '' : ' (Theme Check non exécuté)'}`);
process.exit(errors.length ? 1 : 0);
