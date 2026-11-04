// Moteur de tarification : exactement le même fichier que celui du thème (assets/tp-pricing.js).
// Une copie est conservée dans src/vendor pour déployer le backend seul ; « npm run sync-engine »
// la met à jour et un test vérifie que les deux fichiers sont identiques.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const themeCopy = join(here, '..', '..', 'theme', 'assets', 'tp-pricing.js');
const vendored = join(here, 'vendor', 'tp-pricing.js');
const Pricing = require(process.env.PRICING_ENGINE_PATH || (existsSync(themeCopy) ? themeCopy : vendored));

export default Pricing;
export const { normalizeConfig, quote, quoteVehicles, samePrice, formatMoney, nowLocal, parseLocal, toLocalString, fmt } = Pricing;
