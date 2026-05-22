import { Router } from 'express';
import type { BackendDeps } from '../dependencies';
import { validateParams, validateQuery } from '../middleware/validate';
import { createMoviesController } from './movies.controller';
import { listMoviesQuerySchema, movieIdParamsSchema, type ListMoviesQuery } from './movies.schema';
import { createMoviesService } from './movies.service';

export function createMoviesRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createMoviesController(createMoviesService(deps));

  router.get<Record<string, string>, unknown, unknown, ListMoviesQuery>(
    '/',
    validateQuery(listMoviesQuerySchema),
    controller.listMovies,
  );
  router.get('/:id', validateParams(movieIdParamsSchema), controller.getMovieById);

  return router;
}
