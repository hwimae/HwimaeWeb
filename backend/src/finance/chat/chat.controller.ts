import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceChatService } from './chat.service';

export type FinanceChatController = {
  start: RequestHandler;
  sendMessage: RequestHandler;
  history: RequestHandler;
  close: RequestHandler;
};

export function createFinanceChatController(service: FinanceChatService): FinanceChatController {
  return {
    async start(req: Request, res: Response, next: NextFunction) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.status(201).json(await service.start(userId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async sendMessage(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.sendMessage(userId, req.params.sessionId, req.body));
      } catch (error) {
        next(error);
      }
    },

    async history(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        res.json(await service.history(userId, req.params.sessionId));
      } catch (error) {
        next(error);
      }
    },

    async close(req, res, next) {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        await service.close(userId, req.params.sessionId);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
