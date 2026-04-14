import { Queue, type Job } from "bullmq";
import { chromium, type Page } from "playwright";
import { VTEX_STORES } from "@ofertasas/vtex-client";
import { saveHash } from "@ofertasas/vtex-client/src/hash-manager.js";
import redis from "../lib/redis.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Hash Discovery Worker
 * 
 * Uses Playwright to visit each supermarket in VTEX_STORES,
 * triggers a search, intercepts GraphQL requests to find
 * sha256Hash from the URL's extensions parameter,
 * and saves the hash via saveHash and to DB/Redis.
 */

export async function runHashDiscovery(): Promise<void> {
  console.log("[hash-discovery] Starting hash discovery process");
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  try {
    // Process each store
    for (const [storeKey, store] of Object.entries(VTEX_STORES)) {
      try {
        console.log(`[hash-discovery] Processing ${storeKey}`);
        
        // Create new page for each store
        const context = await browser.newContext({
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        });
        
        // Enable request interception
        await context.route("**/*", async (route) => {
          const request = route.request();
          if (request.url().includes("graphql") && request.url().includes("sha256Hash=")) {
            // Extract hash from URL
            const url = new URL(request.url());
            const hash = url.searchParams.get('sha256Hash');
            if (hash) {
              console.log(`[hash-discovery] Found hash for ${storeKey}: ${hash}`);
              
              // Save hash to Redis via vtex-client
              saveHash(storeKey, hash);
              
              // Save hash to database
              try {
                await prisma.hashDiscovery.create({
                  data: {
                    supermarketId: Object.keys(VTEX_STORES).indexOf(storeKey) + 1, // Simplified ID mapping
                    hash,
                    source: 'auto-worker',
                    isActive: true
                  }
                });
                
                // Save hash to Redis
                await redis.set(`vtex:hash:${storeKey}`, hash, 'EX', 4 * 60 * 60); // 4 hours TTL
              } catch (dbError) {
                console.error(`[hash-discovery] Error saving hash for ${storeKey}:`, dbError);
              }
            }
          }
          await route.continue();
        });
        
        const page = await context.newPage();
        
        // Navigate to store homepage
        console.log(`[hash-discovery] Navigating to ${store.baseUrl}`);
        await page.goto(store.baseUrl, { waitUntil: 'networkidle' });
        
        // Try to trigger search by typing in search bar
        try {
          await page.fill('input[type="search"]', 'a');
          await page.keyboard.press('Enter');
          // Wait for search to complete
          await page.waitForTimeout(3000);
        } catch (searchError) {
          console.log(`[hash-discovery] Search failed for ${storeKey}:`, searchError);
        }
        
        await context.close();
      } catch (error) {
        console.error(`[hash-discovery] Error processing ${storeKey}:`, error);
        // Continue with next store
      }
    }
  } finally {
    await browser.close();
    console.log("[hash-discovery] Hash discovery process completed");
  }
}

export function createHashDiscoveryWorker(): void {
  // Worker will be created by the main worker initialization
  console.log("[hash-discovery] Worker created");
}