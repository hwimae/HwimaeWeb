import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceAdviceService } from './advice.service';

export type FinanceAdviceController = {
  generate: RequestHandler;
};

export function createFinanceAdviceController(service: FinanceAdviceService): FinanceAdviceController {
  return {
    async generate(req: Request, res: Response, next: NextFunction) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.generate(userId, req.body.period));
      } catch (error) {
        next(error);
      }
    },
  };
}
