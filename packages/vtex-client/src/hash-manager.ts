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

import Redis from "ioredis";

interface HashEntry {
  hash: string;
  storedAt: number; // Date.now()
  ttl: number; // milliseconds
}

const hashStore = new Map<string, HashEntry>();

// Redis client (can be set via initHashManager)
let redisClient: Redis | null = null;

const DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Initialize hash manager with Redis client
 */
export function initHashManager(redis: Redis): void {
  redisClient = redis;
}

/**
 * Save a hash for a supermarket.
 */
export function saveHash(
  store: string,
  hash: string,
  ttl: number = DEFAULT_TTL
): void {
  // Save to in-memory store
  hashStore.set(store, {
    hash,
    storedAt: Date.now(),
    ttl,
  });
  
  // Save to Redis if available
  if (redisClient) {
    const key = `vtex:hash:${store}`;
    redisClient.setex(key, Math.floor(ttl / 1000), JSON.stringify({
      hash,
      storedAt: Date.now(),
      ttl
    }));
  }
}

/**
 * Get the current hash for a supermarket.
 * Returns undefined if not found or expired.
 */
export async function getHash(store: string): Promise<string | undefined> {
  const key = `vtex:hash:${store}`;
  
  // Try to get from Redis first if available
  if (redisClient) {
    try {
      const redisValue = await redisClient.get(key);
      if (redisValue) {
        const entry: HashEntry = JSON.parse(redisValue);
        if (!isExpired(entry)) {
          return entry.hash;
        } else {
          // Remove expired entry
          await redisClient.del(key);
        }
      }
    } catch (error) {
      // Fall back to in-memory store if Redis fails
      console.warn("Redis error, falling back to in-memory store:", error);
    }
  }
  
  // Try in-memory store
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
export async function isHashExpired(store: string): Promise<boolean> {
  const key = `vtex:hash:${store}`;
  
  // Try Redis first if available
  if (redisClient) {
    try {
      const redisValue = await redisClient.get(key);
      if (redisValue) {
        const entry: HashEntry = JSON.parse(redisValue);
        return isExpired(entry);
      }
    } catch (error) {
      // Fall back to in-memory store if Redis fails
      console.warn("Redis error, falling back to in-memory store:", error);
    }
  }
  
  // Check in-memory store
  const entry = hashStore.get(store);
  if (!entry) return true;
  return isExpired(entry);
}

/**
 * Get all stored hashes.
 */
export async function getAllHashes(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  // Try to get from Redis if available
  if (redisClient) {
    try {
      const keys = await redisClient.keys("vtex:hash:*");
      for (const key of keys) {
        const redisValue = await redisClient.get(key);
        if (redisValue) {
          try {
            const entry: HashEntry = JSON.parse(redisValue);
            if (!isExpired(entry)) {
              const storeName = key.replace("vtex:hash:", "");
              result[storeName] = entry.hash;
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      }
    } catch (error) {
      // Fall back to in-memory store if Redis fails
      console.warn("Redis error, falling back to in-memory store:", error);
    }
  }
  
  // Add in-memory entries
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
export async function removeHash(store: string): Promise<void> {
  // Remove from in-memory store
  hashStore.delete(store);
  
  // Remove from Redis if available
  if (redisClient) {
    const key = `vtex:hash:${store}`;
    await redisClient.del(key);
  }
}

// Internal helpers

function isExpired(entry: HashEntry): boolean {
  return Date.now() - entry.storedAt > entry.ttl;
}
