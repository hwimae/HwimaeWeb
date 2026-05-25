import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { unauthorized } from '../errors';
import type { ReviewsService } from './reviews.service';

export type ReviewsController = {
  reviewStory: RequestHandler;
  listMyReviews: RequestHandler;
};

function getUserId(req: Request, next: NextFunction): string | undefined {
  if (!req.user) {
    next(unauthorized('Unauthorized'));
    return undefined;
  }

  return req.user.id;
}

export function createReviewsController(reviewsService: ReviewsService): ReviewsController {
  return {
    async reviewStory(req: Request, res: Response, next: NextFunction) {
      const userId = getUserId(req, next);
      if (!userId) return;

      try {
        res.json(await reviewsService.reviewStory(userId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async listMyReviews(req: Request, res: Response, next: NextFunction) {
      const userId = getUserId(req, next);
      if (!userId) return;

      try {
        res.json(await reviewsService.listMyReviews(userId));
      } catch (error) {
        next(error);
      }
    },
  };
}
