import { Queue, type Job } from "bullmq";
import { fetchVtexProducts, VTEX_STORES } from "@ofertasas/vtex-client";
import { PrismaClient } from "@prisma/client";
import { getHash, saveHash } from "@ofertasas/vtex-client/hash-manager";

const prisma = new PrismaClient();

/**
 * Price Scraper Worker
 * 
 * Reads all known products (EANs) from the Product table,
 * fetches current prices from all 3 stores using fetchVtexProducts,
 * saves Price records to DB, and fetches/saves promotions.
 */

export async function runPriceScraper(): Promise<void> {
  console.log("[price-scraper] Starting price scraping process");
  
  try {
    // Get all products from database
    const products = await prisma.product.findMany({
      select: {
        id: true,
        ean: true
      }
    });
    
    console.log(`[price-scraper] Found ${products.length} products to process`);
    
    // Get all supermarkets
    const supermarkets = await prisma.supermarket.findMany({
      select: {
        id: true,
        name: true,
        baseUrl: true
      }
    });
    
    console.log(`[price-scraper] Found ${supermarkets.length} supermarkets`);
    
    // Process each product
    let processedCount = 0;
    for (const product of products) {
      try {
        // For each supermarket, fetch and save prices
        for (const supermarket of supermarkets) {
          try {
            const storeKey = supermarket.name.toLowerCase();
            // Get hash from hash-manager for the store
            const hash = getHash(storeKey);
            
            if (!hash) {
              console.warn(`[price-scraper] No hash found for ${storeKey}. Skipping.`);
              continue;
            }
            
            // Call fetchVtexProducts for this product
            const results = await fetchVtexProducts(supermarket.baseUrl, product.ean, storeKey, 1);
            
            if (results.length > 0) {
              const vtexProduct = results[0];
              
              // Check if price is same as last recorded to avoid duplicates
              const lastPrice = await prisma.price.findFirst({
                where: {
                  productId: product.id,
                  supermarketId: supermarket.id
                },
                orderBy: {
                  recordedAt: 'desc'
                }
              });
              
              // Only save if price has changed or there's no previous record
              if (!lastPrice || 
                  lastPrice.sellingPrice !== vtexProduct.sellingPrice || 
                  lastPrice.listPrice !== vtexProduct.listPrice) {
                
                // Create Price record
                await prisma.price.create({
                  data: {
                    productId: product.id,
                    supermarketId: supermarket.id,
                    sellingPrice: vtexProduct.sellingPrice,
                    listPrice: vtexProduct.listPrice,
                    referencePrice: vtexProduct.referencePrice,
                    isAvailable: vtexProduct.isAvailable,
                    externalId: vtexProduct.externalId,
                    skuId: vtexProduct.skuId
                  }
                });
                
                console.log(`[price-scraper] Saved price for product ${product.ean} at ${supermarket.name}`);
              }
              
              // Check for promotions and save those
              if (vtexProduct.promotions && vtexProduct.promotions.length > 0) {
                for (const promo of vtexProduct.promotions) {
                  // Check if promotion already exists
                  const existingPromo = await prisma.promotion.findFirst({
                    where: {
                      productId: product.id,
                      supermarketId: supermarket.id,
                      description: promo.description
                    }
                  });
                  
                  if (existingPromo) {
                    // Update existing promotion
                    await prisma.promotion.update({
                      where: { id: existingPromo.id },
                      data: {
                        isActive: true,
                        startsAt: promo.startsAt,
                        endsAt: promo.endsAt
                      }
                    });
                  } else {
                    // Create new promotion
                    await prisma.promotion.create({
                      data: {
                        productId: product.id,
                        supermarketId: supermarket.id,
                        type: promo.type,
                        description: promo.description,
                        conditions: promo.conditions,
                        discountValue: promo.discountValue,
                        walletProvider: promo.walletProvider,
                        isActive: true,
                        startsAt: promo.startsAt,
                        endsAt: promo.endsAt
                      }
                    });
                  }
                }
                
                console.log(`[price-scraper] Processed ${vtexProduct.promotions.length} promotions for product ${product.ean} at ${supermarket.name}`);
              }
              
              // Update product metadata if empty
              if (!product.name || !product.brand || !product.category) {
                await prisma.product.update({
                  where: { id: product.id },
                  data: {
                    name: vtexProduct.name || product.name,
                    brand: vtexProduct.brand || product.brand,
                    category: vtexProduct.category || product.category,
                    imageUrl: vtexProduct.imageUrl || product.imageUrl,
                    measurementUnit: vtexProduct.measurementUnit || product.measurementUnit,
                    unitMultiplier: vtexProduct.unitMultiplier || product.unitMultiplier
                  }
                });
              }
            }
          } catch (error) {
            console.error(`[price-scraper] Error processing product ${product.ean} for store ${supermarket.name}:`, error);
          }
        }
        
        processedCount++;
        // Log progress every 10 products
        if (processedCount % 10 === 0) {
          console.log(`[price-scraper] Processed ${processedCount}/${products.length} products`);
        }
      } catch (error) {
        console.error(`[price-scraper] Error processing product ${product.ean}:`, error);
      }
    }
    
    console.log("[price-scraper] Price scraping process completed");
  } catch (error) {
    console.error("[price-scraper] Error in price scraping process:", error);
  }
}

export function createPriceScraperWorker(): void {
  // Worker will be created by the main worker initialization
  console.log("[price-scraper] Worker created");
}