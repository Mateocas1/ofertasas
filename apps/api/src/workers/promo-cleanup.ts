import { Queue, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Promotion Cleanup Worker
 * 
 * Queries Promotion table for records where isActive=true AND endsAt < now(),
 * sets isActive = false on expired promotions,
 * and logs count of deactivated promotions.
 */

export async function runPromoCleanup(): Promise<void> {
  console.log("[promo-cleanup] Starting promotion cleanup process");
  
  try {
    // Find expired promotions
    const now = new Date();
    const expiredPromotions = await prisma.promotion.findMany({
      where: {
        AND: [
          { isActive: true },
          { endsAt: { lt: now } }
        ]
      },
      select: {
        id: true
      }
    });
    
    console.log(`[promo-cleanup] Found ${expiredPromotions.length} expired promotions`);
    
    // Update expired promotions
    if (expiredPromotions.length > 0) {
      const ids = expiredPromotions.map(p => p.id);
      const result = await prisma.promotion.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          isActive: false
        }
      });
      
      console.log(`[promo-cleanup] Deactivated ${result.count} promotions`);
    }
    
    console.log("[promo-cleanup] Promotion cleanup process completed");
  } catch (error) {
    console.error("[promo-cleanup] Error in promotion cleanup process:", error);
  }
}

export function createPromoCleanupWorker(): void {
  // Worker will be created by the main worker initialization
  console.log("[promo-cleanup] Worker created");
}