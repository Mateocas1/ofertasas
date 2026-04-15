import { PrismaClient } from "@ofertasas/db";
import type { StoreResult } from "@ofertasas/vtex-client";

const prisma = new PrismaClient();

export async function syncProductsToDb(storeResults: StoreResult[]) {
  try {
    for (const store of storeResults) {
      if (!store.success || !store.products) continue;

      const supermarket = await prisma.supermarket.findUnique({
        where: { name: store.store }
      });

      if (!supermarket) continue;

      // Process in batches of 10 to not overwhelm connection pool
      for (let i = 0; i < store.products.length; i += 10) {
        const batch = store.products.slice(i, i + 10);
        
        await Promise.all(batch.map(async (product) => {
          if (!product.ean) return;

          // 1. Upsert product
          const dbProduct = await prisma.product.upsert({
            where: { ean: product.ean },
            update: {
              name: product.name,
              brand: product.brand,
              imageUrl: product.image || product.images?.[0] || null,
            },
            create: {
              ean: product.ean,
              name: product.name,
              brand: product.brand,
              imageUrl: product.image || product.images?.[0] || null,
            }
          });

          // 2. Insert price (append only for history)
          await prisma.price.create({
            data: {
              productId: dbProduct.id,
              supermarketId: supermarket.id,
              sellingPrice: product.price,
              listPrice: product.listPrice,
              referencePrice: product.referencePrice,
              isAvailable: product.isAvailable,
              externalId: product.externalId,
              skuId: product.skuId,
            }
          });

          // 3. Sync promotions
          if (product.promotions && product.promotions.length > 0) {
            // Disable all existing active promos for this product+store first
            await prisma.promotion.updateMany({
              where: {
                productId: dbProduct.id,
                supermarketId: supermarket.id,
                isActive: true
              },
              data: { isActive: false }
            });

            // Insert current promos
            for (const promo of product.promotions) {
              await prisma.promotion.create({
                data: {
                  productId: dbProduct.id,
                  supermarketId: supermarket.id,
                  type: promo.type,
                  description: promo.description,
                  discountValue: promo.discountValue,
                  walletProvider: promo.walletProvider,
                  isActive: true,
                }
              });
            }
          }
        }));
      }
    }
  } catch (error) {
    console.error("Failed to sync products to DB:", error instanceof Error ? error.message : error);
  }
}