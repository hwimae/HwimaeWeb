import { Router } from 'express';
import type { BackendDeps } from '../dependencies';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createRatingsController } from './ratings.controller';
import { rateMovieSchema } from './ratings.schema';
import { createRatingsService } from './ratings.service';

export function createRatingsRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createRatingsController(createRatingsService(deps));

  router.post('/', requireAuth(deps), validateBody(rateMovieSchema), controller.rateMovie);
  router.get('/me', requireAuth(deps), controller.listMyRatings);

  return router;
}
