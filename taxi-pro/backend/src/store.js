// Stockage des réservations : un fichier JSON par client, écritures atomiques et sérialisées.
// Suffisant pour une entreprise de taxi (quelques milliers de réservations par an).
// Pour un volume plus important, remplacez ce module par une base de données en gardant la même interface.
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function createStore(dataDir) {
  const queues = new Map();
  const memory = new Map();
  const file = (tenantId) => join(dataDir, tenantId, 'bookings.json');

  function load(tenantId) {
    if (memory.has(tenantId)) return memory.get(tenantId);
    const f = file(tenantId);
    const data = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
    memory.set(tenantId, data);
    return data;
  }
  function persist(tenantId, data) {
    mkdirSync(join(dataDir, tenantId), { recursive: true });
    const tmp = `${file(tenantId)}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 1));
    renameSync(tmp, file(tenantId));
  }
  function serialize(tenantId, fn) {
    const prev = queues.get(tenantId) || Promise.resolve();
    const next = prev.then(fn, fn);
    queues.set(tenantId, next.catch(() => {}));
    return next;
  }

  return {
    get(tenantId, id) { const b = load(tenantId)[id]; return b ? structuredClone(b) : null; },
    list(tenantId) { return Object.values(load(tenantId)).map((b) => structuredClone(b)); },
    findBy(tenantId, pred) { return Object.values(load(tenantId)).find(pred) || null; },
    save(tenantId, booking) {
      return serialize(tenantId, () => {
        const data = load(tenantId);
        data[booking.id] = structuredClone(booking);
        persist(tenantId, data);
        return structuredClone(booking);
      });
    },
    update(tenantId, id, fn) {
      return serialize(tenantId, () => {
        const data = load(tenantId);
        if (!data[id]) return null;
        const next = fn(structuredClone(data[id]));
        if (!next) return null;
        data[id] = next;
        persist(tenantId, data);
        return structuredClone(next);
      });
    }
  };
}
