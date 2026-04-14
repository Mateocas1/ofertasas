import type {
  VtexProductSuggestionsResponse,
  NormalizedProduct,
  StoreResult,
} from "./types.js";
import { normalizeProduct } from "./normalizer.js";
import { getHash } from "./hash-manager.js";

// ============================================
// VTEX Store Configurations
// ============================================

export const VTEX_STORES: Record<
  string,
  { name: string; baseUrl: string }
> = {
  carrefour: {
    name: "Carrefour",
    baseUrl: "https://www.carrefour.com.ar",
  },
  jumbo: {
    name: "Jumbo",
    baseUrl: "https://www.jumbo.com.ar",
  },
  disco: {
    name: "Disco",
    baseUrl: "https://www.disco.com.ar",
  },
};

// ============================================
// VTEX Query Builder
// ============================================

function encodeBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function encodeUrl(str: string): string {
  return encodeURIComponent(str);
}

function buildVariables(
  query: string,
  count: number
): Record<string, unknown> {
  return {
    productOriginVtex: true,
    simulationBehavior: "default",
    hideUnavailableItems: true,
    fullText: query,
    count,
    shippingOptions: [],
    variant: null,
  };
}

function buildExtensions(
  query: string,
  count: number,
  hash: string
): Record<string, unknown> {
  return {
    persistedQuery: {
      version: 1,
      sha256Hash: hash,
      sender: "vtex.store-resources@0.x",
      provider: "vtex.search-graphql@0.x",
    },
    variables: encodeBase64(JSON.stringify(buildVariables(query, count))),
  };
}

function buildUrl(
  baseUrl: string,
  query: string,
  count: number,
  hash: string
): string {
  const extensions = JSON.stringify(
    buildExtensions(query, count, hash)
  );
  const params = new URLSearchParams({
    workspace: "master",
    maxAge: "medium",
    appsEtag: "remove",
    domain: "store",
    locale: "es-AR",
    operationName: "productSuggestions",
    variables: encodeUrl("{}"),
    extensions: encodeUrl(extensions),
  });
  return `${baseUrl}/_v/segment/graphql/v1/?${params.toString()}`;
}

// ============================================
// Fetch with Retry
// ============================================

async function fetchWithRetry(
  url: string,
  timeout: number = 5000,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      clearTimeout(timer);

      if (response.ok) return response;

      // Don't retry on 4xx (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`VTEX API error: ${response.status}`);
      }

      // Retry on 5xx
      lastError = new Error(`VTEX API error: ${response.status}`);
    } catch (error) {
      clearTimeout(timer);
      lastError = error as Error;

      // Don't retry on abort (timeout) after last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        await new Promise((r) =>
          setTimeout(r, 500 * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError ?? new Error("fetchWithRetry: unknown error");
}

// ============================================
// Main Fetch Function
// ============================================

/**
 * Fetches products from a VTEX store.
 *
 * @param baseUrl - Store URL (e.g., "https://www.carrefour.com.ar")
 * @param query - Search term
 * @param source - Store identifier (e.g., "carrefour")
 * @param count - Max products to return (default: 50)
 * @returns Array of normalized products
 */
export async function fetchVtexProducts(
  baseUrl: string,
  query: string,
  source: string,
  count: number = 50
): Promise<NormalizedProduct[]> {
  const hash = await getHash(source);
  if (!hash) {
    console.warn(
      `[vtex-client] No hash found for ${source}. Skipping.`
    );
    return [];
  }

  const cleanBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const url = buildUrl(cleanBaseUrl, query, count, hash);

  try {
    const response = await fetchWithRetry(url);
    const data = (await response.json()) as VtexProductSuggestionsResponse;

    if (data.errors && data.errors.length > 0) {
      console.error(
        `[vtex-client] GraphQL errors for ${source}:`,
        data.errors[0].message
      );
      return [];
    }

    const rawProducts =
      data.data?.productSuggestions?.products ?? [];

    return rawProducts
      .map((p) => normalizeProduct(p, cleanBaseUrl, source))
      .filter((p): p is NormalizedProduct => p !== null);
  } catch (error) {
    console.error(
      `[vtex-client] Error fetching "${query}" from ${source}:`,
      (error as Error).message
    );
    return [];
  }
}

/**
 * Searches products across multiple VTEX stores in parallel.
 *
 * @param query - Search term
 * @param stores - Store keys to search (e.g., ["carrefour", "jumbo"])
 * @param count - Max products per store (default: 50)
 * @returns Results per store with timing info
 */
export async function searchAcrossStores(
  query: string,
  stores: string[] = Object.keys(VTEX_STORES),
  count: number = 50
): Promise<StoreResult[]> {
  const promises = stores.map(async (storeKey): Promise<StoreResult> => {
    const store = VTEX_STORES[storeKey];
    if (!store) {
      return {
        store: storeKey,
        products: [],
        success: false,
        error: `Unknown store: ${storeKey}`,
        responseTime: 0,
      };
    }

    const start = performance.now();
    try {
      const products = await fetchVtexProducts(
        store.baseUrl,
        query,
        storeKey,
        count
      );
      return {
        store: storeKey,
        products,
        success: true,
        responseTime: Math.round(performance.now() - start),
      };
    } catch (error) {
      return {
        store: storeKey,
        products: [],
        success: false,
        error: (error as Error).message,
        responseTime: Math.round(performance.now() - start),
      };
    }
  });

  return Promise.all(promises);
}
