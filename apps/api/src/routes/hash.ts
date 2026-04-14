import { FastifyInstance } from "fastify";
import { discoverHashForStore, discoverAllHashes } from "../lib/hash-discovery.js";

/**
 * Routes for hash discovery and management
 * 
 * Endpoints:
 * - POST /api/hash/discover - Discover all hashes
 * - POST /api/hash/discover/:store - Discover hash for specific store
 * - GET /api/hash/status - Check which hashes are cached
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
}
