import { z } from 'zod';

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// EAN parameter schema
export const eanParamSchema = z.object({
  ean: z.string().length(13, 'EAN must be 13 characters')
});

// Inferred types
export type Pagination = z.infer<typeof paginationSchema>;
export type EanParam = z.infer<typeof eanParamSchema>;