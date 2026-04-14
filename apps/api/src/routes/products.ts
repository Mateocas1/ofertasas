import { FastifyInstance } from "fastify";
import redis from "../lib/redis.js";
import { PrismaClient } from "@prisma/client";
import type { EanParam } from "../schemas/common.js";

const prisma = new PrismaClient();

export async function productRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/products/:ean - Product detail with prices from all stores
  app.get<{
    Params: EanParam
  }>("/api/products/:ean", {
    schema: {
      params: {
        type: "object",
        properties: {
          ean: { type: "string", minLength: 13, maxLength: 13 }
        },
        required: ["ean"]
      }
    }
  }, async (request, reply) => {
    const { ean } = request.params;
    
    try {
      // Try cache first
      const cacheKey = `product:${ean}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return reply.send(JSON.parse(cached));
      }
      
      // TODO: Fetch product details from database or VTEX
      // This would require implementing the actual data fetching logic
      // For now, we'll return a placeholder
      const result = {
        ean,
        message: "Product details endpoint - implementation pending"
      };
      
      // Cache for 6 hours
      await redis.setex(cacheKey, 21600, JSON.stringify(result));
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch product details" });
    }
  });
  
  // GET /api/products/:ean/prices - Just the price data
  app.get<{
    Params: EanParam
  }>("/api/products/:ean/prices", {
    schema: {
      params: {
        type: "object",
        properties: {
          ean: { type: "string", minLength: 13, maxLength: 13 }
        },
        required: ["ean"]
      }
    }
  }, async (request, reply) => {
    const { ean } = request.params;
    
    try {
      // Try cache first
      const cacheKey = `prices:${ean}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return reply.send(JSON.parse(cached));
      }
      
      // TODO: Fetch price data from database
      // For now, we'll return a placeholder
      const result = {
        ean,
        message: "Price data endpoint - implementation pending"
      };
      
      // Cache for 6 hours
      await redis.setex(cacheKey, 21600, JSON.stringify(result));
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch price data" });
    }
  });
  
  // GET /api/products/:ean/promotions - Active promotions
  app.get<{
    Params: EanParam
  }>("/api/products/:ean/promotions", {
    schema: {
      params: {
        type: "object",
        properties: {
          ean: { type: "string", minLength: 13, maxLength: 13 }
        },
        required: ["ean"]
      }
    }
  }, async (request, reply) => {
    const { ean } = request.params;
    
    try {
      // Try cache first
      const cacheKey = `promotions:${ean}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return reply.send(JSON.parse(cached));
      }
      
      // TODO: Fetch promotions data from database
      // For now, we'll return a placeholder
      const result = {
        ean,
        promotions: [],
        message: "Promotions endpoint - implementation pending"
      };
      
      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch promotions" });
    }
  });
  
  // GET /api/products/:ean/history?days=30&supermarketId=1 - Price history from DB
  app.get<{
    Params: EanParam,
    Querystring: {
      days?: number;
      supermarketId?: number;
    }
  }>("/api/products/:ean/history", {
    schema: {
      params: {
        type: "object",
        properties: {
          ean: { type: "string", minLength: 13, maxLength: 13 }
        },
        required: ["ean"]
      },
      querystring: {
        type: "object",
        properties: {
          days: { type: "number", minimum: 1 },
          supermarketId: { type: "number" }
        }
      }
    }
  }, async (request, reply) => {
    const { ean } = request.params;
    const { days = 30, supermarketId } = request.query;
    
    try {
      // Fetch price history from database
      // This is a simplified implementation - in reality, we'd need to query the database properly
      const where: any = {
        product: {
          ean: ean
        }
      };
      
      if (supermarketId) {
        where.supermarketId = supermarketId;
      }
      
      // Calculate date range
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      where.recordedAt = {
        gte: fromDate
      };
      
      // TODO: Actually query the database
      // const priceHistory = await prisma.price.findMany({
      //   where,
      //   orderBy: {
      //     recordedAt: 'asc'
      //   },
      //   select: {
      //     recordedAt: true,
      //     supermarketId: true,
      //     sellingPrice: true,
      //     listPrice: true,
      //     isAvailable: true
      //   }
      // });
      
      // For now, we'll return a placeholder
      const result = {
        ean,
        period: {
          from: fromDate,
          to: new Date()
        },
        // prices: priceHistory,
        prices: [],
        message: "Price history endpoint - implementation pending"
      };
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch price history" });
    }
  });
}