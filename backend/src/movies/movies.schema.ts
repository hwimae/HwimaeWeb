import { z } from 'zod';

export const listMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(200).optional(),
});

export const movieIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>;
export type MovieIdParams = z.infer<typeof movieIdParamsSchema>;
