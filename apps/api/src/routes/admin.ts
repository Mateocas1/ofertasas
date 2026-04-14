import { FastifyInstance } from "fastify";
import { queues } from "../lib/queues.js";

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/admin/refresh-hashes - Triggers hash-discovery BullMQ job
  app.post("/api/admin/refresh-hashes", {
    schema: {
      headers: {
        type: "object",
        properties: {
          "x-api-key": { type: "string" }
        },
        required: ["x-api-key"]
      }
    }
  }, async (request, reply) => {
    const apiKey = request.headers["x-api-key"];
    
    // Check API key
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    try {
      // Trigger hash-discovery job
      const job = await queues.hashDiscovery.add("refresh-hashes", {});
      
      return reply.send({
        success: true,
        jobId: job.id,
        message: "Hash discovery job queued"
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to queue hash discovery job" });
    }
  });
  
  // POST /api/admin/scrape-prices - Triggers price-scraper BullMQ job
  app.post("/api/admin/scrape-prices", {
    schema: {
      headers: {
        type: "object",
        properties: {
          "x-api-key": { type: "string" }
        },
        required: ["x-api-key"]
      }
    }
  }, async (request, reply) => {
    const apiKey = request.headers["x-api-key"];
    
    // Check API key
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    try {
      // Trigger price-scraper job
      const job = await queues.priceScraper.add("scrape-prices", {});
      
      return reply.send({
        success: true,
        jobId: job.id,
        message: "Price scraper job queued"
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to queue price scraper job" });
    }
  });
}