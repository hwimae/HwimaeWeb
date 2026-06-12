import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceExpensesService } from './expenses.service';

export type FinanceExpensesController = {
  list: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
};

export function createFinanceExpensesController(service: FinanceExpensesService): FinanceExpensesController {
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

    async create(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.status(201).json(await service.create(userId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.update(userId, req.params.id, req.body));
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
