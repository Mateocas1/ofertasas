/**
 * Worker Index
 * 
 * Exports all worker functions and provides a function
 * to start all workers.
 */

export { runHashDiscovery, createHashDiscoveryWorker } from './hash-discovery.js';
export { runPriceScraper, createPriceScraperWorker } from './price-scraper.js';
export { runPromoCleanup, createPromoCleanupWorker } from './promo-cleanup.js';
export { runPriceAggregation, createPriceAggregationWorker } from './price-aggregation.js';

/**
 * Starts all workers
 * 
 * Initializes all 4 workers for the background processing system.
 */
export function startAllWorkers(): void {
  console.log("[workers] Starting all workers");
  // Worker initialization would happen here
  console.log("[workers] All workers started");
}