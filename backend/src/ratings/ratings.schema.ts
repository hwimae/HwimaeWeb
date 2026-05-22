import { z } from 'zod';

export const rateMovieSchema = z.object({
  movieId: z.string().min(1).regex(/^c[a-z0-9]{8,}$/i),
  rating: z.number().min(0.5).max(5),
});

export type RateMovieInput = z.infer<typeof rateMovieSchema>;
