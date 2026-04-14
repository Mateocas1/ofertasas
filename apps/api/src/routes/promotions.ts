import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import redis from '../lib/redis.js';

export async function promotionsRoutes(app: FastifyInstance) {
  /**
   * GET /api/promotions
   * Returns all promotions, optionally filtered by store and type
   * Query params: ?store=carrefour&type=percentage
   */
  app.get('/api/promotions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { store, type } = request.query as { store?: string; type?: string };

    try {
      // Get all promotions from cache or search results
      // For now, we'll scan through recent search results
      const cacheKeys = await redis.keys('search:*');
      const allPromotions: any[] = [];

      for (const key of cacheKeys) {
        const cached = await redis.get(key);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.products && Array.isArray(parsed.products)) {
              for (const product of parsed.products) {
                if (product.promotions && Array.isArray(product.promotions)) {
                  // Add product context to each promotion
                  for (const promo of product.promotions) {
                    // Filter by store if provided
                    if (store && promo.supermarketId?.toLowerCase() !== store.toLowerCase()) {
                      continue;
                    }

                    // Filter by type if provided
                    if (type) {
                      const typeMatch = promo.type?.toLowerCase().includes(type.toLowerCase()) ||
                        promo.description?.toLowerCase().includes(type.toLowerCase());
                      if (!typeMatch) continue;
                    }

                    allPromotions.push({
                      id: `${product.ean}-${promo.supermarketId}-${promo.description}`,
                      type: promo.type,
                      description: promo.description,
                      discountValue: promo.discountValue,
                      walletProvider: promo.walletProvider,
                      conditions: promo.conditions,
                      product: {
                        ean: product.ean,
                        name: product.name,
                        brand: product.brand,
                        imageUrl: product.image || product.imageUrl,
                        image: product.image
                      },
                      supermarket: {
                        id: promo.supermarketId,
                        name: promo.supermarketId?.charAt(0).toUpperCase() + promo.supermarketId?.slice(1)
                      },
                      startsAt: promo.startsAt,
                      endsAt: promo.endsAt
                    });
                  }
                }
              }
            }
          } catch (e) {
            // Silently skip malformed cache entries
            continue;
          }
        }
      }

      // Remove duplicates based on id
      const uniquePromotions = Array.from(
        new Map(allPromotions.map(p => [p.id, p])).values()
      );

      // Sort by discount value (highest first)
      uniquePromotions.sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0));

      return reply.send(uniquePromotions);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch promotions' });
    }
  });
}
