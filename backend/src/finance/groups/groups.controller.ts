import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getRequiredUserId } from '../http';
import type { FinanceGroupsService } from './groups.service';

export type FinanceGroupsController = {
  list: RequestHandler;
  create: RequestHandler;
  detail: RequestHandler;
  addMember: RequestHandler;
  removeMember: RequestHandler;
  removeGroup: RequestHandler;
  memberDashboard: RequestHandler;
  memberExpenses: RequestHandler;
  memberBudgets: RequestHandler;
  deleteMemberExpense: RequestHandler;
  deleteMemberBudget: RequestHandler;
};

export function createFinanceGroupsController(service: FinanceGroupsService): FinanceGroupsController {
  function withUser(handler: (userId: string, req: Request, res: Response) => Promise<void>): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = getRequiredUserId(req, next);
      if (!userId) return;
      try {
        await handler(userId, req, res);
      } catch (error) {
        next(error);
      }
    };
  }

  return {
    list: withUser(async (userId, _req, res) => {
      res.json(await service.list(userId));
    }),
    create: withUser(async (userId, req, res) => {
      res.status(201).json(await service.create(userId, req.body));
    }),
    detail: withUser(async (userId, req, res) => {
      res.json(await service.detail(userId, req.params.groupId));
    }),
    addMember: withUser(async (userId, req, res) => {
      res.status(201).json(await service.addMember(userId, req.params.groupId, req.body));
    }),
    removeMember: withUser(async (userId, req, res) => {
      await service.removeMember(userId, req.params.groupId, req.params.memberUserId);
      res.status(204).send();
    }),
    removeGroup: withUser(async (userId, req, res) => {
      await service.removeGroup(userId, req.params.groupId);
      res.status(204).send();
    }),
    memberDashboard: withUser(async (userId, req, res) => {
      res.json(await service.memberDashboard(userId, req.params.groupId, req.params.memberUserId));
    }),
    memberExpenses: withUser(async (userId, req, res) => {
      res.json(await service.memberExpenses(userId, req.params.groupId, req.params.memberUserId));
    }),
    memberBudgets: withUser(async (userId, req, res) => {
      res.json(await service.memberBudgets(userId, req.params.groupId, req.params.memberUserId));
    }),
    deleteMemberExpense: withUser(async (userId, req, res) => {
      await service.deleteMemberExpense(userId, req.params.groupId, req.params.memberUserId, req.params.expenseId);
      res.status(204).send();
    }),
    deleteMemberBudget: withUser(async (userId, req, res) => {
      await service.deleteMemberBudget(userId, req.params.groupId, req.params.memberUserId, req.params.budgetId);
      res.status(204).send();
    }),
  };
}
