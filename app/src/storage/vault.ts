/**
 * Encrypted on-device storage (build spec B3, web version).
 *
 * A random AES-GCM key is created once per device and kept in IndexedDB as a non-extractable
 * CryptoKey, so page scripts can use it but can't read it out. Data is encrypted before it's
 * stored. Nothing here is sent anywhere. Browsers can clear site data, so the app says so.
 */
export interface KeyStore {
  getKey(): Promise<CryptoKey | null>;
  putKey(k: CryptoKey): Promise<void>;
  get(name: string): Promise<{ iv: Uint8Array; data: ArrayBuffer } | null>;
  put(name: string, value: { iv: Uint8Array; data: ArrayBuffer }): Promise<void>;
  clear(): Promise<void>;
}

const DB = 'within-vault';
const STORE = 'kv';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r ? (r as IDBRequest<T>).result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const indexedDbStore: KeyStore = {
  getKey: async () => ((await tx<CryptoKey>('readonly', (s) => s.get('key'))) as CryptoKey | undefined) ?? null,
  putKey: async (k) => void (await tx('readwrite', (s) => void s.put(k, 'key'))),
  get: async (name) => ((await tx('readonly', (s) => s.get(`v:${name}`))) as { iv: Uint8Array; data: ArrayBuffer } | undefined) ?? null,
  put: async (name, value) => void (await tx('readwrite', (s) => void s.put(value, `v:${name}`))),
  clear: async () => void (await tx('readwrite', (s) => void s.clear())),
};

/** In-memory store for tests and for browsers where IndexedDB is unavailable. */
export function memoryStore(): KeyStore {
  let key: CryptoKey | null = null;
  const values = new Map<string, { iv: Uint8Array; data: ArrayBuffer }>();
  return {
    getKey: async () => key,
    putKey: async (k) => void (key = k),
    get: async (n) => values.get(n) ?? null,
    put: async (n, v) => void values.set(n, v),
    clear: async () => {
      key = null;
      values.clear();
    },
  };
}

export class Vault {
  constructor(private store: KeyStore) {}

  private async key(): Promise<CryptoKey> {
    const existing = await this.store.getKey();
    if (existing) return existing;
    const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await this.store.putKey(k);
    return k;
  }

  async save(name: string, value: unknown): Promise<void> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await this.key(), new TextEncoder().encode(JSON.stringify(value)));
    await this.store.put(name, { iv, data });
  }

  async load<T>(name: string): Promise<T | null> {
    const rec = await this.store.get(name);
    if (!rec) return null;
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(rec.iv) }, await this.key(), rec.data);
      return JSON.parse(new TextDecoder().decode(plain)) as T;
    } catch {
      return null; // key lost or data corrupted: start fresh rather than crash
    }
  }

  /** Raw stored bytes, for tests that check nothing readable is at rest. */
  async raw(name: string) {
    return this.store.get(name);
  }

  async wipe(): Promise<void> {
    await this.store.clear();
  }
}

let shared: Vault | null = null;
/** The device vault, or null when storage is blocked (private windows, previews). */
export function deviceVault(): Vault | null {
  if (shared) return shared;
  try {
    if (typeof indexedDB === 'undefined' || !globalThis.crypto?.subtle) return null;
    shared = new Vault(indexedDbStore);
    return shared;
  } catch {
    return null;
  }
}
