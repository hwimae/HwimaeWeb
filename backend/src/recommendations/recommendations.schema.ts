import { z } from 'zod';

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const askRecommendationSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  limit: z.number().int().min(1).max(10).default(5),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
export type AskRecommendationBody = z.infer<typeof askRecommendationSchema>;
