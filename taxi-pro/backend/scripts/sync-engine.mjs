// Copie le moteur de tarification du thème dans le backend (déploiement autonome).
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
copyFileSync(join(here, '..', '..', 'theme', 'assets', 'tp-pricing.js'), join(here, '..', 'src', 'vendor', 'tp-pricing.js'));
console.log('Moteur de tarification synchronisé.');
