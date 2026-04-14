import { Queue, Worker, type Job } from "bullmq";
import redis from "./redis.js";

// ============================================
// Queue Names
// ============================================

export const QUEUE_NAMES = {
  HASH_DISCOVERY: "hash-discovery",
  PRICE_SCRAPER: "price-scraper",
  PROMO_CLEANUP: "promo-cleanup",
  PRICE_AGGREGATION: "price-aggregation",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ============================================
// Queue Instances
// ============================================

export const queues = {
  hashDiscovery: new Queue(QUEUE_NAMES.HASH_DISCOVERY, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  }),

  priceScraper: new Queue(QUEUE_NAMES.PRICE_SCRAPER, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: "exponential", delay: 10000 },
    },
  }),

  promoCleanup: new Queue(QUEUE_NAMES.PROMO_CLEANUP, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 20,
      attempts: 2,
    },
  }),

  priceAggregation: new Queue(QUEUE_NAMES.PRICE_AGGREGATION, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 20,
      attempts: 2,
    },
  }),
} as const;

// ============================================
// Worker Factory
// ============================================

export function createWorker<T = unknown>(
  queueName: QueueName,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });
}

// ============================================
// Schedule Recurring Jobs
// ============================================

export async function scheduleRecurringJobs(): Promise<void> {
  // Hash discovery: every 4 hours
  await queues.hashDiscovery.add(
    "discover-hashes",
    {},
    { repeat: { every: 4 * 60 * 60 * 1000 } }
  );

  // Price scraper: every 6 hours
  await queues.priceScraper.add(
    "scrape-prices",
    {},
    { repeat: { every: 6 * 60 * 60 * 1000 } }
  );

  // Promo cleanup: daily at midnight
  await queues.promoCleanup.add(
    "cleanup-promos",
    {},
    { repeat: { pattern: "0 0 * * *" } }
  );

  // Price aggregation: weekly (Sunday at 2am)
  await queues.priceAggregation.add(
    "aggregate-prices",
    {},
    { repeat: { pattern: "0 2 * * 0" } }
  );

  console.log("[queues] Recurring jobs scheduled");
}
