import { Queue, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Price Aggregation Worker
 * 
 * Finds Price records older than 90 days,
 * groups them by week (productId, supermarketId, week),
 * calculates avg, min, max, availability_rate per group,
 * saves aggregated data (for now, just log),
 * and deletes raw records after aggregation.
 */

export async function runPriceAggregation(): Promise<void> {
  console.log("[price-aggregation] Starting price aggregation process");
  
  try {
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Find old price records
    const oldPrices = await prisma.price.findMany({
      where: {
        recordedAt: {
          lt: ninetyDaysAgo
        }
      },
      select: {
        id: true,
        productId: true,
        supermarketId: true,
        sellingPrice: true,
        isAvailable: true,
        recordedAt: true
      }
    });
    
    console.log(`[price-aggregation] Found ${oldPrices.length} old price records to aggregate`);
    
    // In a real implementation, we would:
    // 1. Group records by week (productId, supermarketId, week)
    // 2. Calculate avg, min, max, availability_rate per group
    // 3. Save aggregated data
    // 4. Delete raw records after aggregation
    
    // For now, we'll just log what we would do
    console.log("[price-aggregation] Would aggregate price data and delete old records");
    
    console.log("[price-aggregation] Price aggregation process completed");
  } catch (error) {
    console.error("[price-aggregation] Error in price aggregation process:", error);
  }
}

export function createPriceAggregationWorker(): void {
  // Worker will be created by the main worker initialization
  console.log("[price-aggregation] Worker created");
}