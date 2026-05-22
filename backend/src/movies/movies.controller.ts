import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ListMoviesQuery, MovieIdParams } from './movies.schema';
import type { MoviesService } from './movies.service';

export type MoviesController = {
  listMovies: RequestHandler<Record<string, string>, unknown, unknown, ListMoviesQuery>;
  getMovieById: RequestHandler<MovieIdParams>;
};

export function createMoviesController(moviesService: MoviesService): MoviesController {
  return {
    async listMovies(req: Request<Record<string, string>, unknown, unknown, ListMoviesQuery>, res: Response, next: NextFunction) {
      try {
        res.json(await moviesService.listMovies(req.query));
      } catch (error) {
        next(error);
      }
    },

    async getMovieById(req: Request<MovieIdParams>, res: Response, next: NextFunction) {
      try {
        res.json(await moviesService.getMovieById(req.params.id));
      } catch (error) {
        next(error);
      }
    },
  };
}
