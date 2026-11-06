// Serveur d'aperçu local du thème TAXI PRO.
//   node taxi-pro/tools/preview/server.mjs [port]
// Pages : /  /pages/reservation  /pages/services  /pages/vehicules  /pages/a-propos  /pages/contact
//         /pages/faq  /pages/tarifs  /pages/mentions-legales  /?view=taxi-config  /search  /cart  /404
// Paramètres de test : ?preset=Corporate (préréglage), ?set_<réglage>=valeur (réglage du thème),
//                      ?design=1 (simule l'éditeur de thème).
// POST /contact reproduit le formulaire de contact Shopify (redirection ?contact_posted=true) ;
// GET /__contact renvoie les messages reçus (tests automatisés).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer } from './render.mjs';

const THEME = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'theme');
const TYPES = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const LEGAL = ['mentions-legales', 'conditions-generales', 'confidentialite', 'cookies'];

export function startPreview({ port = 8791, host = '127.0.0.1', overrides: baseOverrides = {} } = {}) {
  const contacts = [];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${host}:${port}`);
    try {
      if (url.pathname.startsWith('/assets/')) {
        const file = join(THEME, 'assets', url.pathname.slice(8));
        if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(readFileSync(file));
        return;
      }
      if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      if (url.pathname === '/__contact') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(contacts)); return; }
      if (req.method === 'POST' && url.pathname === '/contact') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const fields = Object.fromEntries(new URLSearchParams(body));
        contacts.push(fields);
        // Comme Shopify : retour sur « return_to » s'il est fourni, sinon sur la page d'origine
        if (fields.return_to && fields.return_to.startsWith('/')) {
          res.writeHead(302, { Location: fields.return_to });
          res.end();
          return;
        }
        const back = new URL(req.headers.referer || `http://${host}:${port}/`);
        back.search = 'contact_posted=true';
        res.writeHead(302, { Location: back.pathname + back.search + '#contact_form' });
        res.end();
        return;
      }
      // Routes natives de Shopify : politiques (Paramètres › Politiques)
      if (url.pathname.startsWith('/policies/')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Politique</title></head><body><h1>${url.pathname.slice(10)}</h1></body></html>`);
        return;
      }
      let template = 'index';
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'pages' && parts[1]) {
        template = existsSync(join(THEME, 'templates', `page.${parts[1]}.json`)) ? `page.${parts[1]}` : LEGAL.includes(parts[1]) ? 'page.legal' : 'page';
      } else if (parts[0] === 'search') template = 'search';
      else if (parts[0] === 'cart') template = 'cart';
      else if (parts[0] === 'password') template = 'password';
      else if (parts.length) template = '404';
      if (url.searchParams.get('view') && template === 'index') template = `index.${url.searchParams.get('view')}`;
      const overrides = { ...baseOverrides };
      for (const [k, v] of url.searchParams) {
        if (k.startsWith('set_')) overrides[k.slice(4)] = v === 'true' ? true : v === 'false' ? false : /^-?\d+$/.test(v) ? Number(v) : v;
      }
      const r = createRenderer({ themeDir: THEME, overrides, preset: url.searchParams.get('preset'), designMode: url.searchParams.get('design') === '1' });
      const html = await r.render({ template, path: url.pathname, query: Object.fromEntries(url.searchParams) });
      res.writeHead(template === '404' ? 404 : 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (e) {
      console.error(e);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Erreur de rendu : ${e.stack || e.message}`);
    }
  });
  return new Promise((resolve) => server.listen(port, host, () => resolve({ server, contacts, url: `http://${host}:${server.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8791);
  startPreview({ port }).then(({ url }) => console.log(`Aperçu TAXI PRO : ${url}`));
}
