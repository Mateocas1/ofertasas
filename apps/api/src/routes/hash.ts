import { FastifyInstance } from "fastify";
import { discoverHashForStore, discoverAllHashes } from "../lib/hash-discovery.js";
import redis from "../lib/redis.js";

/**
 * Routes for hash discovery and management
 * 
 * Endpoints:
 * - POST /api/hash/discover - Discover all hashes
 * - POST /api/hash/discover/:store - Discover hash for specific store
 * - POST /api/hash/reset - Clear all cached hashes and rediscover
 */
export async function hashRoutes(app: FastifyInstance): Promise<void> {
  // Discover all hashes
  app.post("/api/hash/discover", async (request, reply) => {
    try {
      const hashes = await discoverAllHashes();
      
      if (Object.keys(hashes).length === 0) {
        return reply.status(500).send({
          error: "Failed to discover hashes",
          message: "Could not extract hashes from any store",
        });
      }

      return reply.send({
        success: true,
        hashes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Hash discovery failed",
        message: (error as Error).message,
      });
    }
  });

  // Discover hash for specific store
  app.post<{ Params: { store: string } }>(
    "/api/hash/discover/:store",
    async (request, reply) => {
      const { store } = request.params;

      try {
        const hash = await discoverHashForStore(store);

        if (!hash) {
          return reply.status(404).send({
            error: "Hash not found",
            message: `Could not discover hash for store: ${store}`,
          });
        }

        return reply.send({
          success: true,
          store,
          hash,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          error: "Hash discovery failed",
          message: (error as Error).message,
        });
      }
    }
  );

  // Reset all cached hashes (admin endpoint)
  app.post("/api/hash/reset", async (request, reply) => {
    try {
      // Clear Redis cache for all hashes
      const stores = ["disco", "carrefour", "jumbo"];
      for (const store of stores) {
        await redis.del(`vtex:hash:discovery:${store}`);
      }

      request.log.info("Hash cache cleared");

      return reply.send({
        success: true,
        message: "Hash cache cleared",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Reset failed",
        message: (error as Error).message,
      });
    }
  });
}
