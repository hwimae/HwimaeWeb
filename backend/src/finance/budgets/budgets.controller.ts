import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceBudgetsService } from './budgets.service';

export type FinanceBudgetsController = {
  list: RequestHandler;
  upsert: RequestHandler;
  remove: RequestHandler;
};

export function createFinanceBudgetsController(service: FinanceBudgetsService): FinanceBudgetsController {
  return {
    async list(req: Request, res: Response, next: NextFunction) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.list(userId));
      } catch (error) {
        next(error);
      }
    },

    async upsert(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.upsert(userId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        await service.remove(userId, req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
