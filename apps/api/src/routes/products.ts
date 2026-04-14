import { FastifyInstance } from "fastify";
import redis from "../lib/redis.js";
import { PrismaClient } from "@prisma/client";
import type { EanParam } from "../schemas/common.js";

const prisma = new PrismaClient();

export async function productRoutes(app: FastifyInstance): Promise<void> {
  // Add a route to get all supermarkets
  app.get("/api/supermarkets", async (request, reply) => {
    try {
      const supermarkets = await prisma.supermarket.findMany({
        select: {
          id: true,
          name: true
        }
      });
      
      return reply.send(supermarkets);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch supermarkets" });
    }
  });
  
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
      
      // Fetch product with latest prices and active promotions
      const product = await prisma.product.findUnique({
        where: { ean },
        include: {
          supermarket: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      if (!product) {
        return reply.status(404).send({ error: "Product not found" });
      }
      
      // Get latest prices per supermarket (latest recordedAt per supermarketId)
      const latestPrices = await prisma.$queryRaw`
        SELECT DISTINCT ON ("supermarketId") 
          p.*,
          s."id" as "supermarketId",
          s."name" as "supermarketName"
        FROM "Price" p
        JOIN "Supermarket" s ON p."supermarketId" = s."id"
        WHERE p."productId" = ${product.id} 
        AND p."recordedAt" = (
          SELECT MAX("recordedAt") 
          FROM "Price" p2 
          WHERE p2."productId" = p."productId" 
          AND p2."supermarketId" = p."supermarketId"
        )
        ORDER BY p."recordedAt" DESC
      `;
      
      // Get active promotions
      const promotions = await prisma.promotion.findMany({
        where: {
          product: { ean },
          isActive: true
        },
        include: {
          supermarket: {
            select: {
              name: true
            }
          }
        }
      });
      
      const result = {
        ...product,
        prices: latestPrices,
        promotions
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
      
      // Get product ID first
      const product = await prisma.product.findUnique({
        where: { ean }
      });
      
      if (!product) {
        return reply.status(404).send({ error: "Product not found" });
      }
      
      // Get latest prices per supermarket (latest recordedAt per supermarketId)
      const latestPrices = await prisma.$queryRaw`
        SELECT DISTINCT ON ("supermarketId") 
          p.*,
          s."name" as "supermarketName"
        FROM "Price" p
        JOIN "Supermarket" s ON p."supermarketId" = s."id"
        WHERE p."productId" = ${product.id} 
        AND p."recordedAt" = (
          SELECT MAX("recordedAt") 
          FROM "Price" p2 
          WHERE p2."productId" = p."productId" 
          AND p2."supermarketId" = p."supermarketId"
        )
        ORDER BY p."recordedAt" DESC
      `;
      
      const result = latestPrices;
      
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
      
      // Get active promotions with supermarket names
      const result = await prisma.promotion.findMany({
        where: {
          product: { ean },
          isActive: true
        },
        include: {
          supermarket: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch promotions" });
    }
  });
  
  // GET /api/products/:ean/history - Price history from DB
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
      // Get product ID first
      const product = await prisma.product.findFirst({
        where: { ean }
      });
      
      if (!product) {
        return reply.status(404).send({ error: "Product not found" });
      }
      
      // Calculate date range
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      // Build where clause
      const where: any = {
        productId: product.id,
        recordedAt: {
          gte: fromDate
        }
      };
      
      if (supermarketId) {
        where.supermarketId = supermarketId;
      }
      
      // Query price history from database
      const priceHistory = await prisma.price.findMany({
        where,
        orderBy: {
          recordedAt: 'asc'
        },
        select: {
          recordedAt: true,
          supermarketId: true,
          sellingPrice: true,
          listPrice: true,
          isAvailable: true
        }
      });
      
      // Group by supermarketId for easy chart consumption
      const groupedHistory: Record<number, any[]> = {};
      priceHistory.forEach(record => {
        if (!groupedHistory[record.supermarketId]) {
          groupedHistory[record.supermarketId] = [];
        }
        groupedHistory[record.supermarketId].push(record);
      });
      
      const result = {
        ean,
        period: {
          from: fromDate,
          to: new Date()
        },
        prices: groupedHistory
      };
      
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch price history" });
    }
  });
}
