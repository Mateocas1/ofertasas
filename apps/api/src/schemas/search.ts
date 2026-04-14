import { z } from 'zod';

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  stores: z.array(z.string()).optional()
});

// Inferred types
export type SearchQuery = z.infer<typeof searchQuerySchema>;