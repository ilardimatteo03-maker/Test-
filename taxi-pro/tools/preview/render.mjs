// Moteur d'aperçu local du thème TAXI PRO (LiquidJS + équivalents des objets et filtres Shopify).
// Sert aux tests automatisés et aux captures : il ne remplace pas l'aperçu Shopify, mais rend
// les mêmes fichiers Liquid avec les mêmes réglages (settings_data, modèles JSON, groupes).
import { Liquid, Hash } from 'liquidjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const GOOGLE_FONTS = {
  cormorant: 'Cormorant', outfit: 'Outfit', archivo: 'Archivo', playfair_display: 'Playfair Display',
  geist: 'Geist', inter: 'Inter', montserrat: 'Montserrat', lato: 'Lato', assistant: 'Assistant'
};
const SERIF = ['cormorant', 'playfair_display', 'playfair', 'garamond', 'bodoni_moda', 'lora', 'fraunces'];

function fontObject(handle) {
  const m = /^(.*)_([ni])(\d)$/.exec(handle || '') || [null, handle || 'sans_serif', 'n', '4'];
  const key = m[1];
  const family = GOOGLE_FONTS[key] || key.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const obj = {
    handle, family: `"${family}"`, fallback_families: SERIF.includes(key) ? 'serif' : 'sans-serif',
    weight: Number(m[3]) * 100, style: m[2] === 'i' ? 'italic' : 'normal', 'system?': false, _key: key
  };
  obj.toString = () => handle;
  return obj;
}

export const POLICIES = [
  { title: "Conditions d'utilisation", url: '/policies/terms-of-service', handle: 'terms-of-service' },
  { title: 'Politique de confidentialité', url: '/policies/privacy-policy', handle: 'privacy-policy' },
  { title: 'Mentions légales', url: '/policies/legal-notice', handle: 'legal-notice' }
];

export function createRenderer({ themeDir, overrides = {}, preset = null, designMode = false }) {
  const read = (p) => readFileSync(join(themeDir, p), 'utf8');
  const locale = JSON.parse(read('locales/fr.default.json'));
  const settingsSchema = JSON.parse(read('config/settings_schema.json'));
  const settingsData = JSON.parse(read('config/settings_data.json'));
  const schemaCache = {};
  const schemaOf = (type) => {
    if (!schemaCache[type]) {
      const src = read(`sections/${type}.liquid`);
      const m = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(src);
      schemaCache[type] = JSON.parse(m[1]);
    }
    return schemaCache[type];
  };

  const pages = {
    reservation: 'Réservation', services: 'Nos services', vehicules: 'Nos véhicules', 'a-propos': 'À propos',
    contact: 'Contact', faq: 'Questions fréquentes', tarifs: 'Tarifs', 'conditions-generales': 'Conditions générales',
    'mentions-legales': 'Mentions légales', confidentialite: 'Politique de confidentialité', cookies: 'Politique de cookies'
  };
  const pageObject = (handle) => handle ? { handle, title: pages[handle] || handle, url: `/pages/${handle}`, content: '<p>Contenu de la page, saisi dans Shopify › Boutique en ligne › Pages.</p>' } : null;
  const menus = {
    'main-menu': { links: [
      { title: 'Accueil', url: '/', links: [] }, { title: 'Services', url: '/pages/services', links: [] },
      { title: 'Véhicules', url: '/pages/vehicules', links: [] }, { title: 'Tarifs', url: '/pages/tarifs', links: [] },
      { title: 'À propos', url: '/pages/a-propos', links: [] }, { title: 'Contact', url: '/pages/contact', links: [] }
    ] },
    footer: { links: [
      { title: 'Conditions générales', url: '/pages/conditions-generales', links: [] }, { title: 'Confidentialité', url: '/pages/confidentialite', links: [] },
      { title: 'Cookies', url: '/pages/cookies', links: [] }, { title: 'Mentions légales', url: '/pages/mentions-legales', links: [] }
    ] }
  };

  function convert(def, value) {
    if (value === undefined) value = def.default;
    switch (def.type) {
      case 'font_picker': return fontObject(value);
      case 'page': return value ? pageObject(value) : null;
      case 'link_list': return value ? menus[value] || { links: [] } : null;
      case 'image_picker': case 'video': case 'collection': case 'product': case 'blog': case 'article': return null;
      case 'color': return value || '';
      case 'checkbox': return !!value;
      default: return value === undefined ? null : value;
    }
  }
  function globalSettings() {
    const values = Object.assign({}, settingsData.current, preset ? settingsData.presets[preset] || {} : {}, overrides);
    const out = {};
    for (const g of settingsSchema) for (const def of g.settings || []) if (def.id) out[def.id] = convert(def, values[def.id]);
    if (overrides.booking_page !== undefined) out.booking_page = pageObject(overrides.booking_page);
    return out;
  }
  function sectionObject(id, data) {
    const sc = schemaOf(data.type);
    const settings = {};
    for (const def of sc.settings || []) if (def.id) settings[def.id] = convert(def, (data.settings || {})[def.id]);
    const blocks = (data.block_order || Object.keys(data.blocks || {})).map((bid) => {
      const b = data.blocks[bid];
      const bs = (sc.blocks || []).find((x) => x.type === b.type) || { settings: [] };
      const bset = {};
      for (const def of bs.settings || []) if (def.id) bset[def.id] = convert(def, (b.settings || {})[def.id]);
      return { id: bid, type: b.type, settings: bset, shopify_attributes: '' };
    });
    return { id, settings, blocks, schema: sc };
  }

  const engine = new Liquid({
    root: [join(themeDir, 'sections'), join(themeDir, 'snippets'), join(themeDir, 'layout'), join(themeDir, 'templates')],
    partials: [join(themeDir, 'snippets')],
    extname: '.liquid', cache: false, strictFilters: true, ownPropertyOnly: false, jsTruthy: false
  });

  /* ---------- Balises Shopify ---------- */
  engine.registerTag('schema', {
    parse(token, remain) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('tag:endschema', () => stream.stop()).on('template', () => {}).on('end', () => { throw new Error('schema non fermé'); });
      stream.start();
    },
    * render() { return ''; }
  });
  const passthrough = (name) => engine.registerTag(name, {
    parse(token, remain) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on(`tag:end${name}`, () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error(`${name} non fermé`); });
      stream.start();
    },
    * render(ctx, emitter) {
      const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
      emitter.write(name === 'style' ? `<style>${html}</style>` : html);
    }
  });
  passthrough('stylesheet'); passthrough('javascript'); passthrough('style');

  engine.registerTag('form', {
    parse(token, remain) {
      const m = /^\s*'([a-z_]+)'\s*,?\s*(.*)$/s.exec(token.args);
      this.formType = m ? m[1] : 'contact';
      this.argsRaw = m ? m[2].replace(/^[a-z_.]+\s*,\s*(?=[a-z_-]+:)/, '') : '';
      this.hash = new Hash(this.argsRaw.replace(/^([a-z_.]+)\s*$/, ''));
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form non fermé'); });
      stream.start();
    },
    * render(ctx, emitter) {
      const attrs = yield this.hash.render(ctx);
      const posted = ctx.getSync(['request', 'contact_posted']);
      const actions = { contact: '/contact', customer_login: '/account/login', create_customer: '/account', storefront_password: '/password', product: '/cart/add' };
      ctx.push({ form: { 'posted_successfully?': this.formType === 'contact' && !!posted, errors: null, name: '', email: '', phone: '', body: '' } });
      const inner = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
      ctx.pop();
      const attr = Object.entries(attrs).map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
      emitter.write(`<form method="post" action="${actions[this.formType] || '/'}" accept-charset="UTF-8"${attr}><input type="hidden" name="form_type" value="${this.formType}"><input type="hidden" name="utf8" value="✓">${inner}</form>`);
    }
  });
  engine.registerTag('paginate', {
    parse(token, remain) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate non fermé'); });
      stream.start();
    },
    * render(ctx, emitter) {
      ctx.push({ paginate: { pages: 1, current_page: 1 } });
      emitter.write(yield this.liquid.renderer.renderTemplates(this.tpls, ctx));
      ctx.pop();
    }
  });
  engine.registerTag('layout', { parse(token) { this.name = token.args.trim().replace(/['"]/g, ''); }, render() { return ''; } });
  const renderSection = async (id, data, scope, groupType) => {
    const sec = sectionObject(id, data);
    const html = await engine.renderFile(`${data.type}.liquid`, Object.assign({}, scope, { section: sec }));
    const cls = sec.schema.class ? ` ${sec.schema.class}` : '';
    const tag = sec.schema.tag || 'div';
    return `<${tag} id="shopify-section-${id}" class="shopify-section${groupType ? ` shopify-section-group-${groupType}` : ''}${cls}">${html}</${tag}>`;
  };
  engine.registerTag('sections', {
    parse(token) { this.group = token.args.trim().replace(/['"]/g, ''); },
    async render(ctx) {
      const g = JSON.parse(read(`sections/${this.group}.json`));
      const scope = ctx.globals;
      let out = '';
      for (const id of g.order) out += await renderSection(`sections--${this.group}__${id}`, g.sections[id], scope, this.group);
      return out;
    }
  });
  engine.registerTag('section', {
    parse(token) { this.name = token.args.trim().replace(/['"]/g, ''); },
    async render(ctx) { return renderSection(this.name, { type: this.name, settings: {} }, ctx.globals); }
  });

  /* ---------- Filtres Shopify ---------- */
  const tr = (key) => key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), locale);
  engine.registerFilter('t', function (key, ...args) {
    let v = tr(key);
    if (v === undefined) return `translation missing: fr.${key}`;
    if (typeof v !== 'string') return JSON.stringify(v);
    const params = {};
    for (const a of args) if (Array.isArray(a)) params[a[0]] = a[1];
    return v.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : ''));
  });
  engine.registerFilter('asset_url', (n) => `/assets/${n}`);
  engine.registerFilter('shopify_asset_url', (n) => `/assets/${n}`);
  engine.registerFilter('stylesheet_tag', (u) => `<link href="${u}" rel="stylesheet" type="text/css" media="all">`);
  engine.registerFilter('script_tag', (u) => `<script src="${u}"></script>`);
  engine.registerFilter('image_url', (img) => (img && img.src) || '');
  engine.registerFilter('image_tag', (url) => (url ? `<img src="${url}" alt="">` : ''));
  engine.registerFilter('video_tag', () => '');
  engine.registerFilter('handleize', (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  engine.registerFilter('money', (c) => `${(Number(c || 0) / 100).toFixed(2).replace('.', ',')} €`);
  engine.registerFilter('font_modify', (font, prop, value) => {
    if (!font || !font.handle) return null;
    if (prop === 'style') return value === 'italic' ? fontObject(font.handle.replace(/_n(\d)$/, '_i$1')) : font;
    let w = font.weight;
    if (value === 'bold') w = 700; else if (value === 'bolder') w = Math.min(900, w + 300); else if (value === 'lighter') w = Math.max(100, w - 300);
    else if (/^[+-]\d+$/.test(value)) w = Math.min(900, Math.max(100, w + Number(value)));
    else if (/^\d+$/.test(value)) w = Number(value);
    return fontObject(font.handle.replace(/_([ni])\d$/, `_$1${w / 100}`));
  });
  const fontImports = new Set();
  engine.registerFilter('font_face', (font) => {
    if (!font || !font._key || !GOOGLE_FONTS[font._key]) return '';
    fontImports.add(`${GOOGLE_FONTS[font._key]}:${font.style === 'italic' ? 'ital,' : ''}wght@${font.style === 'italic' ? '1,' : ''}${font.weight}`);
    return '';
  });
  engine.registerFilter('font_url', () => '');
  engine.registerFilter('color_brightness', (c) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(c || ''));
    if (!m) return 255;
    const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16));
    return (r * 299 + g * 587 + b * 114) / 1000;
  });
  const lum = (c) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(c || ''));
    if (!m) return 1;
    const ch = [m[1], m[2], m[3]].map((x) => { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  engine.registerFilter('color_contrast', (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 10) / 10;
  });
  engine.registerFilter('time_tag', (d) => `<time>${d}</time>`);
  engine.registerFilter('default_errors', (e) => (e ? String(e) : ''));
  engine.registerFilter('default_pagination', () => '');
  engine.registerFilter('format_address', () => '');
  engine.registerFilter('format_code', (c) => c);
  engine.registerFilter('url_encode', (s) => encodeURIComponent(String(s || '')).replace(/%20/g, '+'));

  /* ---------- Rendu d'une page ---------- */
  async function render({ template, path = '/', query = {} }) {
    fontImports.clear();
    const settings = globalSettings();
    const [name, suffix] = template.split('.');
    const handle = name === 'page' ? (path.split('/').pop() || '') : '';
    const page = name === 'page' ? pageObject(handle) : null;
    const scope = {
      settings, page, template: { name, suffix: suffix || null },
      shop: {
        name: 'Taxi Exemple', permanent_domain: 'taxi-exemple.myshopify.com', url: 'http://localhost', currency: 'EUR', description: 'Taxi et chauffeur privé',
        // Paramètres › Détails de la boutique : repris automatiquement quand les réglages du thème sont vides
        phone: '+32 2 000 00 00', email: 'contact@exemple.be',
        address: { address1: "Rue de l'Exemple 1", zip: '1000', city: 'Bruxelles', country: 'Belgique', country_code: 'BE' },
        policies: POLICIES, terms_of_service: POLICIES[0], privacy_policy: POLICIES[1]
      },
      request: { locale: { iso_code: 'fr' }, design_mode: designMode, page_type: name, contact_posted: query.contact_posted === 'true', path },
      routes: { root_url: '/', search_url: '/search', cart_url: '/cart', account_url: '/account', account_register_url: '/account/register', account_logout_url: '/account/logout', account_addresses_url: '/account/addresses' },
      canonical_url: `http://localhost${path}`, page_title: page ? page.title : 'Taxi Exemple, taxi et chauffeur privé',
      page_description: 'Réservez votre taxi en ligne : prix calculé immédiatement, transferts aéroport, chauffeurs professionnels.',
      content_for_header: designMode ? '<script>window.Shopify = { designMode: true };</script>' : '', current_page: 1, current_tags: null, shopify_attributes: ''
    };
    engine.options.globals = scope; // objets globaux Shopify, visibles aussi dans les snippets (balise render)
    let content = '';
    let layout = 'theme';
    if (existsSync(join(themeDir, 'templates', `${template}.json`))) {
      const t = JSON.parse(read(`templates/${template}.json`));
      if (t.layout) layout = t.layout;
      for (const id of t.order) if (!t.sections[id].disabled || query.enable_all === '1') content += await renderSection(`template--${template}__${id}`, t.sections[id], scope);
    } else {
      const env = Object.assign({}, scope);
      const tplText = read(`templates/${template}.liquid`);
      const lm = /\{%-?\s*layout\s+'?([a-z-]+|none)'?\s*-?%\}/.exec(tplText);
      if (lm) layout = lm[1];
      content = await engine.parseAndRender(tplText.replace(/\{%-?\s*layout[^%]*%\}/, ''), env);
    }
    if (layout === 'none') return content;
    let html = await engine.renderFile(`${layout}.liquid`, Object.assign({}, scope, { content_for_layout: content }));
    if (fontImports.size) {
      const fam = [...fontImports].map((f) => `family=${f.replace(/ /g, '+')}`).join('&');
      html = html.replace('</head>', `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fam}&display=swap"></head>`);
    }
    return html;
  }

  return { render, engine, globalSettings };
}
