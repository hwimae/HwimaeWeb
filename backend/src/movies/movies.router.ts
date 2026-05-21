import { Router } from 'express';
import { validateParams, validateQuery } from '../middleware/validate';
import { listMoviesQuerySchema, movieIdParamsSchema, type ListMoviesQuery } from './movies.schema';
import * as moviesService from './movies.service';

export function createMoviesRouter(): Router {
  const router = Router();

  router.get('/', validateQuery(listMoviesQuerySchema), async (req, res, next) => {
    try {
      res.json(await moviesService.listMovies(req.query as unknown as ListMoviesQuery));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', validateParams(movieIdParamsSchema), async (req, res, next) => {
    try {
      res.json(await moviesService.getMovieById(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
