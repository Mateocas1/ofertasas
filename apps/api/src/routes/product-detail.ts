import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import redis from '../lib/redis.js';

export async function productDetailRoutes(app: FastifyInstance) {
  /**
   * GET /api/products/:ean
   * Returns detailed product information with price history
   */
  app.get('/api/products/:ean', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ean } = request.params as { ean: string };

    try {
      // Search for the product across all stores
      const cacheKey = `search:${ean}`;
      let cached = await redis.get(cacheKey);

      let product = null;

      if (!cached) {
        // If not cached, search for it in recent search results
        const searchKeys = await redis.keys('search:*');
        for (const key of searchKeys) {
          const data = await redis.get(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.products) {
                const found = parsed.products.find((p: any) => p.ean === ean);
                if (found) {
                  product = found;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
      } else {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.products && Array.isArray(parsed.products)) {
            product = parsed.products[0];
          }
        } catch (e) {
          // Ignore
        }
      }

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Return product with enhanced data
      // TODO: Add price history from database when implemented
      return reply.send({
        ...product,
        priceHistory: [
          {
            date: new Date().toISOString(),
            prices: product.prices
          }
        ],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch product details' });
    }
  });
}

