import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceSpendingService } from './spending.service';

export type FinanceSpendingController = {
  summary: RequestHandler;
};

export function createFinanceSpendingController(service: FinanceSpendingService): FinanceSpendingController {
  return {
    async summary(req: Request, res: Response, next: NextFunction) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.summary(userId));
      } catch (error) {
        next(error);
      }
    },
  };
}
