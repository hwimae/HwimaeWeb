import { Router } from 'express';
import type { BackendDeps } from '../dependencies';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReviewsController } from './reviews.controller';
import { reviewStorySchema } from './reviews.schema';
import { createReviewsService } from './reviews.service';

export function createReviewsRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createReviewsController(createReviewsService(deps));

  router.post('/', requireAuth(deps), validateBody(reviewStorySchema), controller.reviewStory);
  router.get('/me', requireAuth(deps), controller.listMyReviews);

  return router;
}
