import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { unauthorized } from '../errors';
import type { RatingsService } from './ratings.service';

export type RatingsController = {
  rateMovie: RequestHandler;
  listMyRatings: RequestHandler;
};

function getUserId(req: Request, next: NextFunction): string | undefined {
  if (!req.user) {
    next(unauthorized('Unauthorized'));
    return undefined;
  }

  return req.user.id;
}

export function createRatingsController(ratingsService: RatingsService): RatingsController {
  return {
    async rateMovie(req: Request, res: Response, next: NextFunction) {
      const userId = getUserId(req, next);
      if (!userId) return;

      try {
        res.json(await ratingsService.rateMovie(userId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async listMyRatings(req: Request, res: Response, next: NextFunction) {
      const userId = getUserId(req, next);
      if (!userId) return;

      try {
        res.json(await ratingsService.listMyRatings(userId));
      } catch (error) {
        next(error);
      }
    },
  };
}
