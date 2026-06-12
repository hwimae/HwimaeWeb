import { Router } from 'express';
import type { BackendDeps } from '../dependencies';
import { createFinanceAdviceRouter } from './advice/advice.router';
import { createFinanceBudgetsRouter } from './budgets/budgets.router';
import { createFinanceCategoriesRouter } from './categories/categories.router';
import { createFinanceChatRouter } from './chat/chat.router';
import { createFinanceExpensesRouter } from './expenses/expenses.router';
import { createFinanceInvoicesRouter } from './invoices/invoices.router';
import { createFinanceSpendingRouter } from './spending/spending.router';

export function createFinanceRouter(deps: BackendDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  router.use('/categories', createFinanceCategoriesRouter(deps));
  router.use('/expenses', createFinanceExpensesRouter(deps));
  router.use('/budgets', createFinanceBudgetsRouter(deps));
  router.use('/spending', createFinanceSpendingRouter(deps));
  router.use('/chat', createFinanceChatRouter(deps));
  router.use('/advice', createFinanceAdviceRouter(deps));
  router.use('/invoices', createFinanceInvoicesRouter(deps));

  return router;
}
