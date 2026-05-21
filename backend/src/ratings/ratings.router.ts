import { Router } from 'express';
import type { AppConfig } from '../config';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { rateMovieSchema } from './ratings.schema';
import * as ratingsService from './ratings.service';

export function createRatingsRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/', requireAuth(config), validateBody(rateMovieSchema), async (req, res, next) => {
    try {
      res.json(await ratingsService.rateMovie(req.user!.id, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', requireAuth(config), async (req, res, next) => {
    try {
      res.json(await ratingsService.listMyRatings(req.user!.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
