/**
 * Hash Discovery - Finds the sha256Hash for VTEX productSuggestions query
 * 
 * Strategy:
 * 1. First try hardcoded hashes (for reliability)
 * 2. Then fetch the store's search page (future enhancement)
 * 3. Parse the initial HTML/JS to extract the persisted query hash
 * 4. Cache it in Redis for future use
 */

import { VTEX_STORES } from "@ofertasas/vtex-client";
import { saveHash } from "@ofertasas/vtex-client";
import redis from "../lib/redis.js";

// Hardcoded hashes for productSuggestions - discovered from store network requests
// These are fallbacks when automatic discovery fails
const HARDCODED_HASHES: Record<string, string> = {
  disco: "3eca26a431d4646a8bbce2644b78d3ca734bf8b4ba46afe4269621b64b0fb67d",
  carrefour: "3eca26a431d4646a8bbce2644b78d3ca734bf8b4ba46afe4269621b64b0fb67d",
  jumbo: "3eca26a431d4646a8bbce2644b78d3ca734bf8b4ba46afe4269621b64b0fb67d",
};

const HASH_CACHE_KEY = (store: string) => `vtex:hash:discovery:${store}`;
const HASH_STORAGE_KEY = (store: string) => `vtex:hash:${store}`;

/**
 * Extracts hash from VTEX GraphQL persisted query in HTML/JS
 * Looks for pattern: "sha256Hash":"<hash>"
 */
function extractHashFromResponse(html: string, operationName: string = "productSuggestions"): string | null {
  // Look for sha256Hash in persisted query patterns
  const patterns = [
    // Pattern 1: Direct sha256Hash in JSON
    /"sha256Hash"\s*:\s*"([a-f0-9]{64})"/gi,
    // Pattern 2: In extensions
    /sha256Hash["\']?\s*:\s*["\']([a-f0-9]{64})["\']?/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      // Try to get a hash that's likely for productSuggestions
      for (let i = 1; i < match.length; i++) {
        const hash = match[i];
        if (hash && hash.length === 64) {
          return hash;
        }
      }
    }
  }

  return null;
}

/**
 * Discovers hash for a store by first trying hardcoded hashes, then fetching
 */
export async function discoverHashForStore(storeKey: string): Promise<string | null> {
  const store = VTEX_STORES[storeKey];
  if (!store) {
    throw new Error(`Unknown store: ${storeKey}`);
  }

  try {
    // Try to get from cache first
    const cached = await redis.get(HASH_CACHE_KEY(storeKey));
    if (cached) {
      console.log(`[hash-discovery] Found cached hash for ${storeKey}`);
      return cached;
    }

    // Try hardcoded hash first (most reliable)
    const hardcodedHash = HARDCODED_HASHES[storeKey];
    if (hardcodedHash) {
      console.log(`[hash-discovery] Using hardcoded hash for ${storeKey}: ${hardcodedHash}`);
      
      // Cache in Redis for 24 hours
      await redis.setex(HASH_CACHE_KEY(storeKey), 86400, hardcodedHash);
      
      // Also save to the hash storage (for vtex-client)
      saveHash(storeKey, hardcodedHash, 24 * 60 * 60 * 1000);
      
      return hardcodedHash;
    }

    console.log(`[hash-discovery] Attempting to discover hash for ${storeKey}...`);

    // Fetch the store's search page to extract the hash (fallback)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${store.baseUrl}/?q=test`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${store.baseUrl}: ${response.status}`);
    }

    const html = await response.text();
    const hash = extractHashFromResponse(html, "productSuggestions");

    if (!hash) {
      throw new Error(`Could not extract hash from ${store.baseUrl}`);
    }

    console.log(`[hash-discovery] Discovered hash for ${storeKey}: ${hash}`);

    // Cache in Redis for 24 hours
    await redis.setex(HASH_CACHE_KEY(storeKey), 86400, hash);

    // Also save to the hash storage (for vtex-client)
    saveHash(storeKey, hash, 24 * 60 * 60 * 1000);

    return hash;
  } catch (error) {
    console.error(
      `[hash-discovery] Error discovering hash for ${storeKey}:`,
      error
    );
    return null;
  }
}

/**
 * Discovers hashes for all stores
 */
export async function discoverAllHashes(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const promises = Object.keys(VTEX_STORES).map(async (storeKey) => {
    const hash = await discoverHashForStore(storeKey);
    if (hash) {
      results[storeKey] = hash;
    }
  });

  await Promise.all(promises);
  return results;
}
