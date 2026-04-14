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
import { productRoutes } from './routes/products.js';
import { cartRoutes } from './routes/cart.js';
import { adminRoutes } from './routes/admin.js';
import { hashRoutes } from './routes/hash.js';

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