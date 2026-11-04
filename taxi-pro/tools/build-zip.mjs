// Construit l'archive du thème à importer dans Shopify (Boutique en ligne › Thèmes › Importer un fichier zip).
//   node taxi-pro/tools/build-zip.mjs   → taxi-pro/dist/taxi-pro-theme-<version>.zip
// Écrivain ZIP minimal sans dépendance (méthode « deflate »), ordre de fichiers stable.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = join(ROOT, 'theme');
const DIST = join(ROOT, 'dist');
const FOLDERS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function walk(dir) {
  return readdirSync(dir).sort().flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = FOLDERS.flatMap((f) => walk(join(THEME, f))).filter((f) => !/\.DS_Store$/.test(f));
const version = JSON.parse(readFileSync(join(THEME, 'config', 'settings_schema.json'), 'utf8'))[0].theme_version;
const local = [], central = [];
let offset = 0;
const dosTime = 0, dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1; // date fixe : archive reproductible

for (const file of files) {
  const name = Buffer.from(relative(THEME, file).split(sep).join('/'));
  const data = readFileSync(file);
  const comp = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8);
  head.writeUInt16LE(dosTime, 10); head.writeUInt16LE(dosDate, 12); head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(comp.length, 18); head.writeUInt32LE(data.length, 22); head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28);
  local.push(head, name, comp);
  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10);
  cen.writeUInt16LE(dosTime, 12); cen.writeUInt16LE(dosDate, 14); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20);
  cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42);
  central.push(cen, name);
  offset += head.length + name.length + comp.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);
mkdirSync(DIST, { recursive: true });
const out = join(DIST, `taxi-pro-theme-${version}.zip`);
writeFileSync(out, Buffer.concat([...local, centralBuf, end]));
console.log(`${relative(ROOT, out)} : ${files.length} fichiers, ${(statSync(out).size / 1024).toFixed(0)} Ko`);
