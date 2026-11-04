// Génère snippets/tp-strings.liquid à partir des clés « taxi.booking » de locales/fr.default.json.
// Chaque clé est traduite par le filtre Liquid « t », ce qui suit la langue du visiteur.
// Usage : node taxi-pro/tools/gen-strings.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const THEME = join(dirname(fileURLToPath(import.meta.url)), '..', 'theme');
const fr = JSON.parse(readFileSync(join(THEME, 'locales/fr.default.json'), 'utf8'));
const keys = Object.keys(fr.taxi.booking);
const lines = keys.map((k, i) => `  ${JSON.stringify(k)}: {{ 'taxi.booking.${k}' | t | json }}${i < keys.length - 1 ? ',' : ''}`);
const out = `{%- comment -%}
  Fichier généré par tools/gen-strings.mjs : ne pas modifier à la main.
  Textes de l'interface de réservation, traduits dans la langue du visiteur.
{%- endcomment -%}
{
${lines.join('\n')}
}
`;
writeFileSync(join(THEME, 'snippets/tp-strings.liquid'), out);
console.log(`tp-strings.liquid : ${keys.length} textes`);
