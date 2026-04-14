import { z } from 'zod';

// Cart item schemas
export const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  supermarketId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1).max(99)
});

export const cartItemDeleteSchema = z.object({
  id: z.number().int().positive()
});

// Inferred types
export type AddToCart = z.infer<typeof addToCartSchema>;
export type CartItemUpdate = z.infer<typeof cartItemUpdateSchema>;
export type CartItemDelete = z.infer<typeof cartItemDeleteSchema>;