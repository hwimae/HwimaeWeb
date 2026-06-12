import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceInvoicesService } from './invoices.service';

export type FinanceInvoicesController = {
  list: RequestHandler;
  process: RequestHandler;
};

export function createFinanceInvoicesController(service: FinanceInvoicesService): FinanceInvoicesController {
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

    async process(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400).json({ message: 'File is required' });
        return;
      }
      try {
        res.status(201).json(await service.processUpload(userId, file));
      } catch (error) {
        next(error);
      }
    },
  };
}
