import { FastifyInstance } from "fastify";
import { PrismaClient } from "@ofertasas/db";
import type { AddToCart, CartItemUpdate, CartItemDelete } from "../schemas/cart.js";

const prisma = new PrismaClient();

/**
 * Calculate price change information for an item
 */
async function calculatePriceChange(productId: number, supermarketId: number, storedPrice: number) {
  try {
    // Get the latest price for this product from the database
    const latestPrice = await prisma.price.findFirst({
      where: {
        productId: productId,
        supermarketId: supermarketId
      },
      orderBy: {
        recordedAt: 'desc'
      },
      select: {
        sellingPrice: true
      }
    });
    
    if (!latestPrice || latestPrice.sellingPrice === null) return null;
    
    // Compare prices and return change info if different
    if (latestPrice.sellingPrice !== storedPrice) {
      const priceDifference = latestPrice.sellingPrice - storedPrice;
      return {
        direction: priceDifference > 0 ? 'up' : 'down',
        oldPrice: storedPrice,
        newPrice: latestPrice.sellingPrice,
        difference: Math.abs(priceDifference)
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/cart - Get cart items for sessionId
  app.get("/api/cart", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          sessionId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const { sessionId } = request.query as { sessionId?: string };
    
    if (!sessionId) {
      return reply.status(400).send({ error: "Session ID is required" });
    }
    
    try {
      // Find or create cart
      let cart = await prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });
      }
      
      // Add price change detection to cart items
      const itemsWithPriceChanges = [];
      let grandTotal = 0;
      
      for (const item of cart.items) {
        // Calculate item total
        const currentItem = item as any;
        const itemTotal = currentItem.price * item.quantity;
        grandTotal += itemTotal;
        
        // Check for price changes
        const priceChange = await calculatePriceChange(item.productId, item.supermarketId, currentItem.price);
        
        itemsWithPriceChanges.push({
          ...item,
          priceChange // Will be null if no change, or contain change details if there is one
        });
      }
      
      // Group items by store
      const itemsByStore: Record<string, any[]> = {};
      // TODO: Implement actual grouping logic
      // This is a simplified version - in reality, we'd need to fetch actual product data
      
      return reply.send({
        sessionId,
        items: itemsWithPriceChanges,
        itemsByStore,
        grandTotal,
        itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch cart" });
    }
  });
  
  // POST /api/cart/items - Add item to cart
  app.post<{
    Body: AddToCart
  }>("/api/cart/items", {
    schema: {
      body: {
        type: "object",
        properties: {
          productId: { type: "number" },
          supermarketId: { type: "number" },
          quantity: { type: "number", minimum: 1, maximum: 99 }
        },
        required: ["productId", "supermarketId"]
      }
    }
  }, async (request, reply) => {
    const { sessionId } = request;
    const { productId, supermarketId, quantity = 1 } = request.body as AddToCart & { sessionId: string };
    
    if (!sessionId) {
      return reply.status(400).send({ error: "Session ID is required" });
    }
    
    try {
      // Find or create cart
      let cart = await prisma.cart.findUnique({
        where: { sessionId },
      });
      
      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId }
        });
      }
      
      // Check if item already exists in cart (same product + same store)
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId_supermarketId: {
            cartId: cart.id,
            productId,
            supermarketId
          }
        }
      });
      
      let cartItem;
      if (existingItem) {
        // Increment quantity
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity
          }
        });
      } else {
        // Create new item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            supermarketId,
            quantity
          }
        });
      }
      
      // Return updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      return reply.send({
        success: true,
        cart: updatedCart,
        item: cartItem
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to add item to cart" });
    }
  });
  
  // PATCH /api/cart/items/:id - Update item quantity
  app.patch<{
    Params: { id: string },
    Body: CartItemUpdate
  }>("/api/cart/items/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          quantity: { type: "number", minimum: 1, maximum: 99 }
        },
        required: ["quantity"]
      }
    }
  }, async (request, reply) => {
    const itemId = parseInt(request.params.id);
    const { quantity } = request.body;
    
    try {
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
      
      return reply.send({
        success: true,
        item: updatedItem
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to update cart item" });
    }
  });
  
  // DELETE /api/cart/items/:id - Remove item from cart
  app.delete<{
    Params: { id: string }
  }>("/api/cart/items/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    }
  }, async (request, reply) => {
    const itemId = parseInt(request.params.id);
    
    try {
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
      
      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to remove cart item" });
    }
  });
  
  // DELETE /api/cart - Clear entire cart
  app.delete("/api/cart", async (request, reply) => {
    const { sessionId } = request.query as { sessionId?: string };
    
    if (!sessionId) {
      return reply.status(400).send({ error: "Session ID is required" });
    }
    
    try {
      // Find cart
      const cart = await prisma.cart.findUnique({
        where: { sessionId }
      });
      
      if (!cart) {
        return reply.status(404).send({ error: "Cart not found" });
      }
      
      // Delete all items in cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      
      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to clear cart" });
    }
  });
}