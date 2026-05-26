import { z } from 'zod';

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
