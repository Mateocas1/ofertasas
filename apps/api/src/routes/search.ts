import { FastifyInstance } from "fastify";
import { searchAcrossStores } from "@ofertasas/vtex-client";
import redis from "../lib/redis.js";
import { syncProductsToDb } from "../lib/db-sync.js";
import type { StoreResult, NormalizedProduct } from "@ofertasas/vtex-client";
import type { SearchQuery } from "../schemas/search.js";

interface GroupedProduct {
  ean: string;
  name: string;
  brand: string | null;
  image: string;
  prices: Record<string, any>;
  cheapest: string;
  promotions: any[];
}

/**
 * Converts the grouped product format (prices as object) to the frontend format (prices as array)
 */
function convertToFrontendFormat(groupedProduct: GroupedProduct) {
  const pricesArray = Object.entries(groupedProduct.prices).map(([storeName, priceInfo]) => ({
    supermarketId: storeName,
    sellingPrice: priceInfo.price,
    listPrice: priceInfo.listPrice,
    referencePrice: priceInfo.referencePrice,
    isAvailable: priceInfo.isAvailable,
  }));

  return {
    ean: groupedProduct.ean,
    name: groupedProduct.name,
    brand: groupedProduct.brand,
    image: groupedProduct.image,
    imageUrl: groupedProduct.image,
    prices: pricesArray,
    promotions: groupedProduct.promotions,
    cheapestStore: groupedProduct.cheapest,
  };
}

/**
 * Groups products by EAN across stores
 */
function groupProductsByEan(storeResults: StoreResult[]): { groupedProducts: GroupedProduct[], failures: Array<{ store: string, error: string }> } {
  const productMap: Map<string, GroupedProduct> = new Map();
  
  // Process each store's results
  const failures: Array<{ store: string, error: string }> = [];
  for (const storeResult of storeResults) {
    if (!storeResult.success) {
      // Record the failure
      failures.push({ 
        store: storeResult.store, 
        error: storeResult.error || "Store request failed" 
      });
      continue;
    }
    
    for (const product of storeResult.products) {
      if (!product.ean) continue;
      
      // Create or get existing grouped product
      let groupedProduct = productMap.get(product.ean);
      if (!groupedProduct) {
        groupedProduct = {
          ean: product.ean,
          name: product.name,
          brand: product.brand,
          image: product.image,
          prices: {},
          cheapest: "",
          promotions: []
        };
        productMap.set(product.ean, groupedProduct);
      }
      
      // Add price for this store
      const storeName = storeResult.store;
      groupedProduct.prices[storeName] = {
        price: product.price,
        listPrice: product.listPrice,
        isAvailable: product.isAvailable,
        referencePrice: product.referencePrice
      };
      
      // Accumulate promotions from all stores (avoid duplicates)
      if (product.promotions && Array.isArray(product.promotions)) {
        for (const promo of product.promotions) {
          // Check if this promo already exists (by description and store)
          const promoExists = groupedProduct.promotions.some(
            p => p.description === promo.description && p.supermarketId === storeName
          );
          if (!promoExists) {
            groupedProduct.promotions.push({
              ...promo,
              supermarketId: storeName
            });
          }
        }
      }
    }
  }
  
  // Convert map to array and find cheapest store for each product
  const result: GroupedProduct[] = [];
  for (const groupedProduct of productMap.values()) {
    // Find cheapest store
    let cheapestStore = "";
    let cheapestPrice = Infinity;
    
    for (const [store, priceInfo] of Object.entries(groupedProduct.prices)) {
      if (priceInfo.price && priceInfo.price < cheapestPrice) {
        cheapestPrice = priceInfo.price;
        cheapestStore = store;
      }
    }
    
    groupedProduct.cheapest = cheapestStore;
    result.push(groupedProduct);
  }
  
  return { groupedProducts: result, failures };
}

/**
 * Gets the cache key for a search query
 */
function getSearchCacheKey(query: string, stores: string[]): string {
  const storeKey = stores.sort().join(",");
  return `search:${query}:${storeKey}`;
}

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/search/cache/clear - Debug endpoint to clear search cache
  app.post("/api/search/cache/clear", async (request, reply) => {
    try {
      const keys = await redis.keys("search:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return reply.send({ 
        success: true, 
        message: `Cleared ${keys.length} search cache entries`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to clear cache" });
    }
  });

  // GET /api/search?q={query}&stores={store1,store2}
  app.get<{
    Querystring: SearchQuery
  }>("/api/search", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          q: { type: "string", minLength: 2 },
          stores: { type: "array", items: { type: "string" } }
        },
        required: ["q"]
      }
    }
  }, async (request, reply) => {
    const { q: query, stores = ["carrefour", "jumbo", "disco"] } = request.query;
    
    // Check cache first
    const cacheKey = getSearchCacheKey(query, stores);
    const cachedResult = await redis.get(cacheKey);
    
    if (cachedResult) {
      const result = JSON.parse(cachedResult);
      return reply.send({ ...result, cached: true, responseTime: 0 });
    }
    
    try {
      // Search across stores
      const start = Date.now();
      const storeResults = await searchAcrossStores(query, stores);
      const responseTime = Date.now() - start;
      
       // Group results by EAN and get failures
       const { groupedProducts, failures } = groupProductsByEan(storeResults);
       
       // Trigger DB sync in the background
       syncProductsToDb(storeResults).catch(err => 
         request.log.error({ err }, "Background DB sync failed")
       );
       
       // Convert to frontend format
       const convertedProducts = groupedProducts.map(convertToFrontendFormat);
       
       // Cache the result for 1 hour
       const result = {
         query,
         products: convertedProducts,
         failures, // Include failures in response
         cached: false,
         responseTime
       };
      
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Search failed" });
    }
  });
}