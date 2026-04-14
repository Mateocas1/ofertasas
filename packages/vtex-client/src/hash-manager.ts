/**
 * Hash Manager for VTEX sha256Hash storage.
 *
 * Strategy:
 * 1. In-memory Map (for development / when Redis is unavailable)
 * 2. Redis (production) — will be wired in T-3.2
 * 3. Database fallback (HashDiscovery table)
 *
 * Hashes expire and need to be refreshed by the hash-discovery worker.
 */

interface HashEntry {
  hash: string;
  storedAt: number; // Date.now()
  ttl: number; // milliseconds
}

const hashStore = new Map<string, HashEntry>();

const DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Save a hash for a supermarket.
 */
export function saveHash(
  store: string,
  hash: string,
  ttl: number = DEFAULT_TTL
): void {
  hashStore.set(store, {
    hash,
    storedAt: Date.now(),
    ttl,
  });
}

/**
 * Get the current hash for a supermarket.
 * Returns undefined if not found or expired.
 */
export function getHash(store: string): string | undefined {
  const entry = hashStore.get(store);
  if (!entry) return undefined;

  if (isExpired(entry)) {
    hashStore.delete(store);
    return undefined;
  }

  return entry.hash;
}

/**
 * Check if a hash has expired.
 */
export function isHashExpired(store: string): boolean {
  const entry = hashStore.get(store);
  if (!entry) return true;
  return isExpired(entry);
}

/**
 * Get all stored hashes.
 */
export function getAllHashes(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [store, entry] of hashStore) {
    if (!isExpired(entry)) {
      result[store] = entry.hash;
    }
  }
  return result;
}

/**
 * Remove a hash.
 */
export function removeHash(store: string): void {
  hashStore.delete(store);
}

// Internal helpers

function isExpired(entry: HashEntry): boolean {
  return Date.now() - entry.storedAt > entry.ttl;
}
