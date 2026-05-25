import { z } from 'zod';

export const reviewStorySchema = z.object({
  storyId: z.string().min(1).regex(/^c[a-z0-9]{8,}$/i),
  rating: z.number().min(0.5).max(5),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

export type ReviewStoryInput = z.infer<typeof reviewStorySchema>;
