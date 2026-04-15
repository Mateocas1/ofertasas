import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';

// Import session plugin
import { sessionPlugin } from './middleware/session.js';

// Import hash manager
import { initHashManager } from '@ofertasas/vtex-client';
import redis from './lib/redis.js';

// Import route handlers
import { searchRoutes } from './routes/search.js';
import { promotionsRoutes } from './routes/promotions.js';
import { productRoutes } from './routes/products.js';
import { cartRoutes } from './routes/cart.js';
import { adminRoutes } from './routes/admin.js';
import { hashRoutes } from './routes/hash.js';

// Import Prisma for auto-sync
import { PrismaClient } from '@ofertasas/db';
import { execSync } from 'child_process';

// Auto-sync database schema on startup (creates tables if they don't exist)
const prisma = new PrismaClient();
try {
  await prisma.$connect();
  console.log('Database connected. Syncing schema...');
  // Use raw SQL to create tables if they don't exist (idempotent)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "supermarkets" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "baseUrl" TEXT NOT NULL DEFAULT '',
      "vtexHash" TEXT,
      "hashExpires" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "products" (
      "id" SERIAL PRIMARY KEY,
      "ean" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "brand" TEXT,
      "category" TEXT,
      "imageUrl" TEXT,
      "measurementUnit" TEXT,
      "unitMultiplier" DOUBLE PRECISION,
      "supermarketId" INTEGER REFERENCES "supermarkets"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "prices" (
      "id" SERIAL PRIMARY KEY,
      "productId" INTEGER NOT NULL REFERENCES "products"("id"),
      "supermarketId" INTEGER NOT NULL REFERENCES "supermarkets"("id"),
      "sellingPrice" DOUBLE PRECISION,
      "listPrice" DOUBLE PRECISION,
      "referencePrice" DOUBLE PRECISION,
      "isAvailable" BOOLEAN NOT NULL DEFAULT true,
      "externalId" TEXT,
      "skuId" TEXT,
      "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "prices_productId_supermarketId_recordedAt_idx" ON "prices"("productId", "supermarketId", "recordedAt");
    CREATE INDEX IF NOT EXISTS "prices_recordedAt_idx" ON "prices"("recordedAt");
    CREATE TABLE IF NOT EXISTS "promotions" (
      "id" SERIAL PRIMARY KEY,
      "productId" INTEGER NOT NULL REFERENCES "products"("id"),
      "supermarketId" INTEGER NOT NULL REFERENCES "supermarkets"("id"),
      "type" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "conditions" JSONB,
      "discountValue" DOUBLE PRECISION,
      "walletProvider" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "startsAt" TIMESTAMP(3),
      "endsAt" TIMESTAMP(3),
      "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "promotions_productId_supermarketId_idx" ON "promotions"("productId", "supermarketId");
    CREATE INDEX IF NOT EXISTS "promotions_isActive_idx" ON "promotions"("isActive");
    CREATE TABLE IF NOT EXISTS "carts" (
      "id" SERIAL PRIMARY KEY,
      "sessionId" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "cart_items" (
      "id" SERIAL PRIMARY KEY,
      "cartId" INTEGER NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
      "productId" INTEGER NOT NULL REFERENCES "products"("id"),
      "supermarketId" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cartId_productId_supermarketId_key" ON "cart_items"("cartId", "productId", "supermarketId");
    CREATE TABLE IF NOT EXISTS "hash_discoveries" (
      "id" SERIAL PRIMARY KEY,
      "supermarketId" INTEGER NOT NULL,
      "hash" TEXT NOT NULL,
      "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "source" TEXT NOT NULL DEFAULT 'auto-worker',
      "isActive" BOOLEAN NOT NULL DEFAULT true
    );
    CREATE INDEX IF NOT EXISTS "hash_discoveries_supermarketId_isActive_idx" ON "hash_discoveries"("supermarketId", "isActive");
  `);
  // Seed supermarkets if empty
  const supermarketCount = await prisma.supermarket.count();
  if (supermarketCount === 0) {
    await prisma.supermarket.createMany({
      data: [
        { name: 'carrefour', baseUrl: 'https://www.carrefour.com.ar' },
        { name: 'jumbo', baseUrl: 'https://www.jumbo.com.ar' },
        { name: 'disco', baseUrl: 'https://www.disco.com.ar' },
      ],
      skipDuplicates: true,
    });
    console.log('Seeded supermarkets');
  }
  console.log('Database schema synced successfully');
} catch (error) {
  console.warn('Database schema sync failed (tables may already exist or DB unavailable):', error instanceof Error ? error.message : error);
}

// Initialize Fastify app
const app = fastify({ logger: true });

// Initialize hash manager with Redis
initHashManager(redis);

// Register plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-API-Key'],
  credentials: true
});

await app.register(rateLimit, {
  max: 300,
  timeWindow: '15 minutes'
});

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
});

// Register session plugin
await app.register(sessionPlugin);

// Register routes
await app.register(hashRoutes);
await app.register(searchRoutes);
await app.register(promotionsRoutes);
await app.register(productRoutes);
await app.register(cartRoutes);
await app.register(adminRoutes);

// 404 handler
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    statusCode: 404
  });
});

// Global error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500
  });
});

// Health endpoint
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root endpoint
app.get('/', async () => {
  return {
    message: 'oferTASAS API - Batch 4 Implementation',
    version: '1.0.0',
    documentation: 'https://github.com/your-repo/docs'
  };
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen({ host: '0.0.0.0', port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening on port ${PORT}`);
});
