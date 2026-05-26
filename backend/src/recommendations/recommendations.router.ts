import { Router } from 'express';
import type { BackendDeps } from '../dependencies';
import { validateQuery } from '../middleware/validate';
import { createRecommendationsController } from './recommendations.controller';
import { recommendationsQuerySchema, type RecommendationsQuery } from './recommendations.schema';
import { createRecommendationsService } from './recommendations.service';

export function createRecommendationsRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createRecommendationsController(createRecommendationsService(deps), deps);

  router.get<Record<string, string>, unknown, unknown, RecommendationsQuery>(
    '/popular',
    validateQuery(recommendationsQuerySchema),
    controller.listPopularRecommendations,
  );
  router.get<Record<string, string>, unknown, unknown, RecommendationsQuery>(
    '/me',
    validateQuery(recommendationsQuerySchema),
    controller.listMyRecommendations,
  );

  return router;
}
